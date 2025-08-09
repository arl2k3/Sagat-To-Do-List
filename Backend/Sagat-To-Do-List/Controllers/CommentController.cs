using Sagat_To_Do_List.DTOs;
using Sagat_To_Do_List.Data;
using Sagat_To_Do_List.Entities;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Sagat_To_Do_List.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class CommentsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public CommentsController(ApplicationDbContext context)
        {
            _context = context;
        }

        [HttpPost]
        public async Task<ActionResult<CommentDto>> CreateComment(CreateCommentDto createCommentDto)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(createCommentDto.Comment))
                    return BadRequest("El contenido del comentario es requerido.");

                // Verificar que la tarea existe en la bd
                var TaskExists = await _context.Tasks.AnyAsync(t => t.Id == createCommentDto.TaskId);
                if (!TaskExists)
                    return BadRequest("La tarea especificada no existe.");

                // Si es una respuesta, verificar que el comentario padre exista en la bd
                if (createCommentDto.ParentCommentId.HasValue)
                {
                    var parentExists = await _context.Comments
                        .AnyAsync(c => c.Id == createCommentDto.ParentCommentId.Value &&
                                    c.TaskId == createCommentDto.TaskId);
                    if (!parentExists)
                        return BadRequest("El comentario padre no existe o no pertenece a la tarea especificada.");
                }

                var Comment = new Comments
                {
                    Comment = createCommentDto.Comment,
                    TaskId = createCommentDto.TaskId,
                    ParentCommentId = createCommentDto.ParentCommentId,
                };

                _context.Comments.Add(Comment);
                await _context.SaveChangesAsync();

                var CommentDto = MapToDto(Comment);
                return CreatedAtAction(nameof(GetCommentsByTask),
                    new { TaskId = CommentDto.TaskId }, CommentDto);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Error interno del servidor: {ex.Message}");
            }
        }

        [HttpGet("Task/{TaskId}")]
        public async Task<ActionResult<IEnumerable<CommentDto>>> GetCommentsByTask(int TaskId)
        {
            try
            {
                var Comments = await _context.Comments
                    .Where(c => c.TaskId == TaskId && c.ParentCommentId == null)
                    .Include(c => c.Replies)
                    .ToListAsync();

                var CommentsDto = Comments.Select(MapToDto);
                return Ok(CommentsDto);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Error interno del servidor: {ex.Message}");
            }
        }

        [HttpPut("{id}")]
        public async Task<ActionResult<CommentDto>> UpdateComment(int id, UpdateCommentDto updateCommentDto)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(updateCommentDto.Comment))
                    return BadRequest("El contenido del comentario es requerido.");

                var comentario = await _context.Comments.FindAsync(id);
                if (comentario == null)
                    return NotFound($"No se encontró el comentario con ID {id}");

                comentario.Comment = updateCommentDto.Comment;

                await _context.SaveChangesAsync();

                var comentarioDto = MapToDto(comentario);
                return Ok(comentarioDto);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Error interno del servidor: {ex.Message}");
            }
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteComment(int id)
        {
            try
            {
                var comentario = await _context.Comments
                    .Include(c => c.Replies)
                    .FirstOrDefaultAsync(c => c.Id == id);

                if (comentario == null)
                    return NotFound($"No se encontró el comentario con ID {id}");

                if (comentario.Replies.Any())
                {
                    _context.Comments.RemoveRange(comentario.Replies);
                }

                _context.Comments.Remove(comentario);
                await _context.SaveChangesAsync();

                return NoContent();
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Error interno del servidor: {ex.Message}");
            }
        }

        private static CommentDto MapToDto(Comments Comment)
        {
            return new CommentDto
            {
                Id = Comment.Id,
                Comment = Comment.Comment,
                IsUpdated = Comment.IsUpdated,
                TaskId = Comment.TaskId,
                ParentCommentId = Comment.ParentCommentId,
                Replies = Comment.Replies?.Select(MapToDto).ToList() ?? new List<CommentDto>()
            };
        }
    }
}
