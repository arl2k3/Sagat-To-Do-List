using Sagat_To_Do_List.DTOs;
using Sagat_To_Do_List.Data;
using Sagat_To_Do_List.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace Sagat_To_Do_List.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize] // Proteger todos los endpoints
    public class CommentsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public CommentsController(ApplicationDbContext context)
        {
            _context = context;
        }

        [HttpPost]
        public async Task<ActionResult<CommentDto>> CreateComentario(CreateCommentDto createCommentDto)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(createCommentDto.Comment))
                    return BadRequest("El contenido del comentario es requerido.");

                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userId))
                    return Unauthorized("Usuario no válido.");

                var taskExists = await _context.Tasks.AnyAsync(t => t.Id == createCommentDto.TaskId);
                if (!taskExists)
                    return BadRequest("La tarea especificada no existe.");

                if (createCommentDto.ParentCommentId.HasValue)
                {
                    var parentExists = await _context.Comments
                        .AnyAsync(c => c.Id == createCommentDto.ParentCommentId.Value && 
                                    c.TaskId == createCommentDto.TaskId);
                    if (!parentExists)
                        return BadRequest("El comentario padre no existe o no pertenece a la tarea especificada.");
                }

                var comentario = new Comments
                {
                    Comment = createCommentDto.Comment,
                    TaskId = createCommentDto.TaskId,
                    ParentCommentId = createCommentDto.ParentCommentId,
                    IsUpdated = false,
                    CreatedByUserId = userId
                };

                _context.Comments.Add(comentario);
                await _context.SaveChangesAsync();

                // Recargar con información del usuario
                var comentarioConUsuario = await _context.Comments
                    .Include(c => c.CreatedByUser)
                    .FirstAsync(c => c.Id == comentario.Id);

                var CommentDto = MapToDto(comentarioConUsuario);
                return CreatedAtAction(nameof(GetCommentsByTarea), 
                    new { TaskId = CommentDto.TaskId }, CommentDto);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Error interno del servidor: {ex.Message}");
            }
        }

        [HttpGet("tarea/{TaskId}")]
        public async Task<ActionResult<IEnumerable<CommentDto>>> GetCommentsByTarea(int TaskId)
        {
            try
            {
                var tareaExists = await _context.Tasks.AnyAsync(t => t.Id == TaskId);
                if (!tareaExists)
                    return NotFound($"La tarea con ID {TaskId} no existe.");

                var CommentsJerarquicos = await GetOrdenComentarios(TaskId);
                return Ok(CommentsJerarquicos);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Error interno del servidor: {ex.Message}");
            }
        }

        [HttpPut("{id}")]
        public async Task<ActionResult<CommentDto>> UpdateComentario(int id, UpdateCommentDto updateCommentDto)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(updateCommentDto.Comment))
                    return BadRequest("El contenido del comentario es requerido.");

                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                var userRole = User.FindFirst(ClaimTypes.Role)?.Value;
                
                if (string.IsNullOrEmpty(userId))
                    return Unauthorized("Usuario no válido.");

                var comentario = await _context.Comments
                    .Include(c => c.CreatedByUser)
                    .FirstOrDefaultAsync(c => c.Id == id);
                    
                if (comentario == null)
                    return NotFound($"No se encontró el comentario con ID {id}");

                // Solo el creador del comentario o un admin puede editarlo
                if (comentario.CreatedByUserId != userId && userRole != "admin")
                    return Forbid("No tienes permisos para editar este comentario.");

                comentario.Comment = updateCommentDto.Comment;
                comentario.IsUpdated = true;

                await _context.SaveChangesAsync();

                var CommentDto = MapToDto(comentario);
                return Ok(CommentDto);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Error interno del servidor: {ex.Message}");
            }
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteComentario(int id)
        {
            try
            {
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                var userRole = User.FindFirst(ClaimTypes.Role)?.Value;
                
                if (string.IsNullOrEmpty(userId))
                    return Unauthorized("Usuario no válido.");

                var comentario = await _context.Comments.FindAsync(id);
                if (comentario == null)
                    return NotFound($"No se encontró el comentario con ID {id}");

                // Solo el creador del comentario o un admin puede eliminarlo
                if (comentario.CreatedByUserId != userId && userRole != "admin")
                    return Forbid("No tienes permisos para eliminar este comentario.");

                await EliminarVariosComentarios(id);
                await _context.SaveChangesAsync();

                return NoContent();
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Error interno del servidor: {ex.Message}");
            }
        }
        private async Task EliminarVariosComentarios(int comentarioId)
        {
            var respuestas = await _context.Comments
                .Where(c => c.ParentCommentId == comentarioId)
                .ToListAsync();

            foreach (var respuesta in respuestas)
            {
                await EliminarVariosComentarios(respuesta.Id);
            }

            var comentario = await _context.Comments.FindAsync(comentarioId);
            if (comentario != null)
            {
                _context.Comments.Remove(comentario);
            }
        }

        private async Task<List<CommentDto>> GetOrdenComentarios(int TaskId)
        {
            var todosLosComments = await _context.Comments
                .Include(c => c.CreatedByUser)
                .Where(c => c.TaskId == TaskId)
                .OrderBy(c => c.Id)
                .ToListAsync();

            var CommentsPorId = todosLosComments.ToDictionary(c => c.Id);
            var CommentsRaiz = new List<CommentDto>();

            foreach (var comentario in todosLosComments)
            {
                var CommentDto = MapToDto(comentario);

                if (comentario.ParentCommentId == null)
                {
                    CommentsRaiz.Add(CommentDto);
                }
                else
                {
                    if (CommentsPorId.ContainsKey(comentario.ParentCommentId.Value))
                    {
                        var padre = FindComentariosOrden(CommentsRaiz, comentario.ParentCommentId.Value);
                        if (padre != null)
                        {
                            padre.Replies.Add(CommentDto);
                        }
                    }
                }
            }

            return CommentsRaiz;
        }

        private CommentDto? FindComentariosOrden(List<CommentDto> Comments, int id)
        {
            foreach (var comentario in Comments)
            {
                if (comentario.Id == id)
                    return comentario;

                var encontrado = FindComentariosOrden(comentario.Replies, id);
                if (encontrado != null)
                    return encontrado;
            }
            return null;
        }

        private static CommentDto MapToDto(Comments comentario)
        {
            return new CommentDto
            {
                Id = comentario.Id,
                Comment = comentario.Comment,
                IsUpdated = comentario.IsUpdated,
                TaskId = comentario.TaskId,
                ParentCommentId = comentario.ParentCommentId,
                CreatedByUserId = comentario.CreatedByUserId,
                Replies = new List<CommentDto>()
            };
        }
    }
}
