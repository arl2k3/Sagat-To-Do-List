namespace Sagat_To_Do_List.DTOs
{
    /// <summary>
    /// DTO que representa una tarea completa con sus comentarios
    /// </summary>
    public class TaskDto
    {
        /// <summary>
        /// Identificador único de la tarea
        /// </summary>
        public int Id { get; set; }
        
        /// <summary>
        /// Título de la tarea
        /// </summary>
        public string Title { get; set; } = string.Empty;
        
        /// <summary>
        /// Descripción detallada de la tarea
        /// </summary>
        public string Description { get; set; } = string.Empty;
        
        /// <summary>
        /// Indica si la tarea ha sido completada
        /// </summary>
        public bool IsCompleted { get; set; }
        
        /// <summary>
        /// ID del usuario que creó la tarea
        /// </summary>
        public string CreatedByUserId { get; set; } = string.Empty;
        
        /// <summary>
        /// Lista de comentarios asociados a la tarea organizados jerárquicamente
        /// </summary>
        public List<CommentDto> Comments { get; set; } = new List<CommentDto>();
    }
    
    /// <summary>
    /// DTO para la creación de nuevas tareas
    /// </summary>
    public class CreateTaskDto
    {
        /// <summary>
        /// Título de la nueva tarea (requerido)
        /// </summary>
        public string Title { get; set; } = string.Empty;
        
        /// <summary>
        /// Descripción de la nueva tarea (opcional)
        /// </summary>
        public string Description { get; set; } = string.Empty;
    }
    
    /// <summary>
    /// DTO para la actualización de tareas existentes
    /// </summary>
    public class UpdateTaskDto
    {
        /// <summary>
        /// Nuevo título de la tarea (opcional)
        /// </summary>
        public string? Title { get; set; }
        
        /// <summary>
        /// Nueva descripción de la tarea (opcional)
        /// </summary>
        public string? Description { get; set; }
        
        /// <summary>
        /// Nuevo estado de completado de la tarea (opcional)
        /// </summary>
        public bool? IsCompleted { get; set; }
    }
}
