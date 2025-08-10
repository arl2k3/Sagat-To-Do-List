using System.ComponentModel.DataAnnotations;

namespace Sagat_To_Do_List.DTOs
{
    /// <summary>
    /// DTO que representa la información básica de un usuario
    /// </summary>
    public class UserDto
    {
        /// <summary>
        /// Identificador único del usuario
        /// </summary>
        public string Id { get; set; } = string.Empty;
        
        /// <summary>
        /// Dirección de correo electrónico del usuario
        /// </summary>
        public string Email { get; set; } = string.Empty;
    }
    
    /// <summary>
    /// DTO que representa la respuesta del proceso de autenticación
    /// </summary>
    public class LoginResponseDto
    {
        /// <summary>
        /// Token JWT para autenticación en las siguientes peticiones
        /// </summary>
        public string Token { get; set; } = string.Empty;
        
        /// <summary>
        /// Información básica del usuario autenticado
        /// </summary>
        public UserDto User { get; set; } = new UserDto();
        
        /// <summary>
        /// Rol asignado al usuario (admin, user, etc.)
        /// </summary>
        public string Role { get; set; } = string.Empty;
    }

    /// <summary>
    /// DTO para la creación de nuevos usuarios y autenticación
    /// </summary>
    public class CreateUserDto
    {
        /// <summary>
        /// Dirección de correo electrónico del usuario (debe ser válida)
        /// </summary>
        [Required]
        [EmailAddress]
        public string Email { get; set; } = string.Empty;

        /// <summary>
        /// Contraseña del usuario (mínimo 6 caracteres)
        /// </summary>
        [Required]
        [MinLength(6)]
        public string Password { get; set; } = string.Empty;
    }
}
