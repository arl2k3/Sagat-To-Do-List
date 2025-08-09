using Sagat_To_Do_List.DTOs;
using Sagat_To_Do_List.Data;
using Sagat_To_Do_List.Entities;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Sagat_To_Do_List.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class TasksController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public TasksController(ApplicationDbContext context)
        {
            _context = context;
        }

        [HttpPost]
        public async Task<ActionResult<TaskDto>> CreateTask(CreateTaskDto createTaskDto)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(createTaskDto.Title))
                    return BadRequest("El título de la tarea es requerido.");

                var tarea = new Tasks
                {
                    Title = createTaskDto.Title,
                    Description = createTaskDto.Description,
                    IsCompleted = false,
                };

                _context.Tasks.Add(tarea);
                await _context.SaveChangesAsync();

                var tareaDto = MapToDto(tarea);
                return CreatedAtAction(nameof(GetTaskById), new { id = tareaDto.Id }, tareaDto);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Error interno del servidor: {ex.Message}");
            }
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<TaskDto>>> GetAllTasks()
        {
            try
            {
                var tareas = await _context.Tasks
                    .Include(t => t.Comments.Where(c => c.ParentCommentId == null))
                        .ThenInclude(c => c.Replies)
                    .ToListAsync();

                var tareasDto = tareas.Select(MapToDto);
                return Ok(tareasDto);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Error interno del servidor: {ex.Message}");
            }
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<TaskDto>> GetTaskById(int id)
        {
            try
            {
                var tarea = await _context.Tasks
                    .Include(t => t.Comments.Where(c => c.ParentCommentId == null))
                        .ThenInclude(c => c.Replies)
                    .FirstOrDefaultAsync(t => t.Id == id);

                if (tarea == null)
                    return NotFound($"No se encontró la tarea con ID {id}");

                var tareaDto = MapToDto(tarea);
                return Ok(tareaDto);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Error interno del servidor: {ex.Message}");
            }
        }

        [HttpPut("{id}")]
        public async Task<ActionResult<TaskDto>> UpdateTask(int id, UpdateTaskDto updateTaskDto)
        {
            try
            {
                var tarea = await _context.Tasks.FindAsync(id);
                if (tarea == null)
                    return NotFound($"No se encontró la tarea con ID {id}");

                if (!string.IsNullOrEmpty(updateTaskDto.Title))
                    tarea.Title = updateTaskDto.Title;
                if (!string.IsNullOrEmpty(updateTaskDto.Description))
                    tarea.Description = updateTaskDto.Description;

                if (updateTaskDto.IsCompleted.HasValue)
                    tarea.IsCompleted = updateTaskDto.IsCompleted.Value;

                await _context.SaveChangesAsync();

                var tareaDto = MapToDto(tarea);
                return Ok(tareaDto);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Error interno del servidor: {ex.Message}");
            }
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteTask(int id)
        {
            try
            {
                var Task = await _context.Tasks.FindAsync(id);
                if (Task == null)
                    return NotFound($"No se encontró la Task con ID {id}");

                _context.Tasks.Remove(Task);
                await _context.SaveChangesAsync();

                return NoContent();
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Error interno del servidor: {ex.Message}");
            }
        }

        private static TaskDto MapToDto(Tasks Task)
        {
            return new TaskDto
            {
                Id = Task.Id,
                Title = Task.Title,
                Description = Task.Description,
                IsCompleted = Task.IsCompleted,
                Comments = Task.Comments?.Select(MapCommentToDto).ToList() ?? new List<CommentDto>()
            };
        }

        private static CommentDto MapCommentToDto(Comments comment)
        {
            return new CommentDto
            {
                Id = comment.Id,
                Comment = comment.Comment,
                IsUpdated = comment.IsUpdated,
                TaskId = comment.TaskId,
                ParentCommentId = comment.ParentCommentId,
                Replies = comment.Replies?.Select(MapCommentToDto).ToList() ?? new List<CommentDto>()
            };
        }
    }
}
