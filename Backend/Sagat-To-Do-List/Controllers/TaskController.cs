using Sagat_To_Do_List.DTOs;
using Sagat_To_Do_List.Data;
using Sagat_To_Do_List.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace Sagat_To_Do_List.Controllers
{
    /// <summary>
    /// Controlador para la gestión de tareas del sistema
    /// </summary>
    [ApiController]
    [Route("api/[controller]")]
    [Authorize] 
    public class TasksController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public TasksController(ApplicationDbContext context)
        {
            _context = context;
        }
        /// <summary>
        /// Crea una nueva tarea
        /// </summary>
        /// <param name="createTaskDto">Datos de la tarea (Title y Description)</param>
        /// <returns>TaskDto con la tarea creada incluyendo sus comentarios</returns>
        /// <response code="201">Tarea creada exitosamente</response>
        /// <response code="400">Título de la tarea es requerido</response>
        /// <response code="401">Usuario no válido</response>
        /// <response code="500">Error interno del servidor</response>
        [HttpPost]
        [ProducesResponseType(typeof(TaskDto), 201)]
        [ProducesResponseType(400)]
        [ProducesResponseType(401)]
        [ProducesResponseType(500)]
        public async Task<ActionResult<TaskDto>> CreateTarea(CreateTaskDto createTaskDto)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(createTaskDto.Title))
                    return BadRequest("El título de la tarea es requerido.");

                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userId))
                    return Unauthorized("Usuario no válido.");

                var tarea = new Tasks
                {
                    Title = createTaskDto.Title,
                    Description = createTaskDto.Description,
                    IsCompleted = false,
                    CreatedByUserId = userId
                };

                _context.Tasks.Add(tarea);
                await _context.SaveChangesAsync();

                // Recargar con información del usuario
                var tareaConUsuario = await _context.Tasks
                    .Include(t => t.CreatedByUser)
                    .FirstAsync(t => t.Id == tarea.Id);

                var TaskDto = MapToDto(tareaConUsuario);
                TaskDto.Comments = await GetCommentsOrden(tarea.Id);
                return CreatedAtAction(nameof(GetTareaById), new { id = TaskDto.Id }, TaskDto);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Error interno del servidor: {ex.Message}");
            }
        }

        /// <summary>
        /// Obtiene todas las tareas del sistema
        /// </summary>
        /// <returns>Lista de TaskDto con comentarios</returns>
        /// <response code="200">Lista de tareas obtenida exitosamente</response>
        /// <response code="401">Usuario no autenticado</response>
        /// <response code="500">Error interno del servidor</response>
        [HttpGet]
        [ProducesResponseType(typeof(IEnumerable<TaskDto>), 200)]
        [ProducesResponseType(401)]
        [ProducesResponseType(500)]
        public async Task<ActionResult<IEnumerable<TaskDto>>> GetAllTasks()
        {
            try
            {
                var Tasks = await _context.Tasks
                    .Include(t => t.CreatedByUser)
                    .OrderByDescending(t => t.Id)
                    .ToListAsync();

                var TasksDto = new List<TaskDto>();

                foreach (var tarea in Tasks)
                {
                    var TaskDto = MapToDto(tarea);
                    TaskDto.Comments = await GetCommentsOrden(tarea.Id);
                    TasksDto.Add(TaskDto);
                }

                return Ok(TasksDto);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Error interno del servidor: {ex.Message}");
            }
        }

        /// <summary>
        /// Obtiene una tarea específica por su ID
        /// </summary>
        /// <param name="id">ID de la tarea a obtener</param>
        /// <returns>TaskDto con comentarios</returns>
        /// <response code="200">Tarea obtenida exitosamente</response>
        /// <response code="401">Usuario no autenticado</response>
        /// <response code="404">Tarea no encontrada</response>
        /// <response code="500">Error interno del servidor</response>
        [HttpGet("{id}")]
        [ProducesResponseType(typeof(TaskDto), 200)]
        [ProducesResponseType(401)]
        [ProducesResponseType(404)]
        [ProducesResponseType(500)]
        public async Task<ActionResult<TaskDto>> GetTareaById(int id)
        {
            try
            {
                var tarea = await _context.Tasks
                    .Include(t => t.CreatedByUser)
                    .FirstOrDefaultAsync(t => t.Id == id);

                if (tarea == null)
                    return NotFound($"No se encontró la tarea con ID {id}");

                var TaskDto = MapToDto(tarea);
                TaskDto.Comments = await GetCommentsOrden(tarea.Id);

                return Ok(TaskDto);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Error interno del servidor: {ex.Message}");
            }
        }

        /// <summary>
        /// Actualiza una tarea existente. Solo el creador o un admin pueden actualizarla
        /// </summary>
        /// <param name="id">ID de la tarea a actualizar</param>
        /// <param name="updateTaskDto">Campos a actualizar: Title, Description, IsCompleted</param>
        /// <returns>TaskDto actualizado con comentarios</returns>
        /// <response code="200">Tarea actualizada exitosamente</response>
        /// <response code="401">Usuario no válido</response>
        /// <response code="403">Sin permisos para actualizar la tarea</response>
        /// <response code="404">Tarea no encontrada</response>
        /// <response code="500">Error interno del servidor</response>
        [HttpPut("{id}")]
        [ProducesResponseType(typeof(TaskDto), 200)]
        [ProducesResponseType(401)]
        [ProducesResponseType(403)]
        [ProducesResponseType(404)]
        [ProducesResponseType(500)]
        public async Task<ActionResult<TaskDto>> UpdateTarea(int id, UpdateTaskDto updateTaskDto)
        {
            try
            {
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                var userRole = User.FindFirst(ClaimTypes.Role)?.Value;
                
                if (string.IsNullOrEmpty(userId))
                    return Unauthorized("Usuario no válido.");

                var tarea = await _context.Tasks
                    .Include(t => t.CreatedByUser)
                    .FirstOrDefaultAsync(t => t.Id == id);
                    
                if (tarea == null)
                    return NotFound($"No se encontró la tarea con ID {id}");

                // Solo el creador de la tarea o un admin puede editarla
                if (tarea.CreatedByUserId != userId && userRole != "admin")
                    return Forbid("No tienes permisos para editar esta tarea.");

                if (!string.IsNullOrEmpty(updateTaskDto.Title))
                    tarea.Title = updateTaskDto.Title;
                
                if (!string.IsNullOrEmpty(updateTaskDto.Description))
                    tarea.Description = updateTaskDto.Description;
                
                if (updateTaskDto.IsCompleted.HasValue)
                    tarea.IsCompleted = updateTaskDto.IsCompleted.Value;

                await _context.SaveChangesAsync();

                var TaskDto = MapToDto(tarea);
                TaskDto.Comments = await GetCommentsOrden(tarea.Id);
                return Ok(TaskDto);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Error interno del servidor: {ex.Message}");
            }
        }

        /// <summary>
        /// Elimina una tarea existente. Solo el creador o un admin pueden eliminarla
        /// </summary>
        /// <param name="id">ID de la tarea a eliminar</param>
        /// <returns>204 No Content si se elimina exitosamente</returns>
        /// <response code="204">Tarea eliminada exitosamente</response>
        /// <response code="401">Usuario no válido</response>
        /// <response code="403">Sin permisos para eliminar la tarea</response>
        /// <response code="404">Tarea no encontrada</response>
        /// <response code="500">Error interno del servidor</response>
        [HttpDelete("{id}")]
        [ProducesResponseType(204)]
        [ProducesResponseType(401)]
        [ProducesResponseType(403)]
        [ProducesResponseType(404)]
        [ProducesResponseType(500)]
        public async Task<IActionResult> DeleteTarea(int id)
        {
            try
            {
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                var userRole = User.FindFirst(ClaimTypes.Role)?.Value;
                
                if (string.IsNullOrEmpty(userId))
                    return Unauthorized("Usuario no válido.");

                var tarea = await _context.Tasks.FindAsync(id);
                if (tarea == null)
                    return NotFound($"No se encontró la tarea con ID {id}");

                // Solo el creador de la tarea o un admin puede eliminarla
                if (tarea.CreatedByUserId != userId && userRole != "admin")
                    return Forbid("No tienes permisos para eliminar esta tarea.");

                _context.Tasks.Remove(tarea);
                await _context.SaveChangesAsync();

                return NoContent();
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Error interno del servidor: {ex.Message}");
            }
        }
        private static TaskDto MapToDto(Tasks tarea)
        {
            return new TaskDto
            {
                Id = tarea.Id,
                Title = tarea.Title,
                Description = tarea.Description,
                IsCompleted = tarea.IsCompleted,
                CreatedByUserId = tarea.CreatedByUserId,
                Comments = new List<CommentDto>()
            };
        }

        private async Task<List<CommentDto>> GetCommentsOrden(int TaskId)
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
                var Comments = MapComentarioToDto(comentario);

                if (comentario.ParentCommentId == null)
                {
                    CommentsRaiz.Add(Comments);
                }
                else
                {
                    if (CommentsPorId.ContainsKey(comentario.ParentCommentId.Value))
                    {
                        var padre = FindCommentsOrden(CommentsRaiz, comentario.ParentCommentId.Value);
                        if (padre != null)
                        {
                            padre.Replies.Add(Comments);
                        }
                    }
                }
            }

            return CommentsRaiz;
        }

        private CommentDto? FindCommentsOrden(List<CommentDto> Comments, int id)
        {
            foreach (var comentario in Comments)
            {
                if (comentario.Id == id)
                    return comentario;

                var encontrado = FindCommentsOrden(comentario.Replies, id);
                if (encontrado != null)
                    return encontrado;
            }
            return null;
        }

        private static CommentDto MapComentarioToDto(Comments comentario)
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
