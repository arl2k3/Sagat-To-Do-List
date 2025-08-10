namespace Sagat_To_Do_List.DTOs
{
    /// <summary>
    /// DTO que representa un comentario completo con sus respuestas anidadas
    /// </summary>
    public class CommentDto
    {
        /// <summary>
        /// Identificador único del comentario
        /// </summary>
        public int Id { get; set; }
        
        /// <summary>
        /// Contenido del comentario
        /// </summary>
        public string Comment { get; set; } = string.Empty;
        
        /// <summary>
        /// Indica si el comentario ha sido editado después de su creación
        /// </summary>
        public bool IsUpdated { get; set; }
        
        /// <summary>
        /// ID de la tarea a la que pertenece el comentario
        /// </summary>
        public int TaskId { get; set; }
        
        /// <summary>
        /// ID del comentario padre (null si es un comentario de primer nivel)
        /// </summary>
        public int? ParentCommentId { get; set; }
        
        /// <summary>
        /// ID del usuario que creó el comentario
        /// </summary>
        public string CreatedByUserId { get; set; } = string.Empty;
        
        /// <summary>
        /// Lista de respuestas anidadas al comentario
        /// </summary>
        public List<CommentDto> Replies { get; set; } = new List<CommentDto>();
    }
    
    /// <summary>
    /// DTO para la creación de nuevos comentarios
    /// </summary>
    public class CreateCommentDto
    {
        /// <summary>
        /// Contenido del nuevo comentario (requerido)
        /// </summary>
        public string Comment { get; set; } = string.Empty;
        
        /// <summary>
        /// ID de la tarea a la que se asociará el comentario
        /// </summary>
        public int TaskId { get; set; }
        
        /// <summary>
        /// ID del comentario padre (opcional, para respuestas anidadas)
        /// </summary>
        public int? ParentCommentId { get; set; }
    }
    
    /// <summary>
    /// DTO para la actualización de comentarios existentes
    /// </summary>
    public class UpdateCommentDto
    {
        /// <summary>
        /// Nuevo contenido del comentario (requerido)
        /// </summary>
        public string Comment { get; set; } = string.Empty;
    }
}
