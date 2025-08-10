using Sagat_To_Do_List.DTOs;
using Sagat_To_Do_List.Services;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;

namespace Sagat_To_Do_List.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly UserManager<IdentityUser> _userManager;
        private readonly SignInManager<IdentityUser> _signInManager;
        private readonly IJwtService _jwtService;

        public AuthController(
            UserManager<IdentityUser> userManager,
            SignInManager<IdentityUser> signInManager,
            IJwtService jwtService)
        {
            _userManager = userManager;
            _signInManager = signInManager;
            _jwtService = jwtService;
        }

        [HttpPost("register")]
        public async Task<ActionResult<UserDto>> Register(CreateUserDto createUserDto)
        {
            try
            {
                if (!ModelState.IsValid)
                    return BadRequest(ModelState);

                var existingUser = await _userManager.FindByEmailAsync(createUserDto.Email);
                if (existingUser != null)
                    return BadRequest("El usuario con este email ya existe.");

                var user = new IdentityUser
                {
                    UserName = createUserDto.Email,
                    Email = createUserDto.Email
                };

                var result = await _userManager.CreateAsync(user, createUserDto.Password);
                
                if (!result.Succeeded)
                {
                    return BadRequest(result.Errors.Select(e => e.Description));
                }

                // Asignar rol "user" por defecto
                await _userManager.AddToRoleAsync(user, "user");

                var userDto = new UserDto
                {
                    Id = user.Id,
                    Email = user.Email ?? string.Empty
                };

                return CreatedAtAction(nameof(Register), new { id = userDto.Id }, userDto);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Error interno del servidor: {ex.Message}");
            }
        }

        [HttpPost("login")]
        public async Task<ActionResult<LoginResponseDto>> Login(CreateUserDto createUserDto)
        {
            try
            {
                if (!ModelState.IsValid)
                    return BadRequest(ModelState);

                var user = await _userManager.FindByEmailAsync(createUserDto.Email);
                if (user == null)
                    return Unauthorized("Credenciales inválidas.");

                var result = await _signInManager.CheckPasswordSignInAsync(user, createUserDto.Password, false);
                if (!result.Succeeded)
                    return Unauthorized("Credenciales inválidas.");

                // Obtener el rol del usuario
                var roles = await _userManager.GetRolesAsync(user);
                var role = roles.FirstOrDefault() ?? "user"; 

                // Generar JWT
                var token = await _jwtService.GenerateJwtToken(user, role);

                var response = new LoginResponseDto
                {
                    Token = token,
                    User = new UserDto
                    {
                        Id = user.Id,
                        Email = user.Email ?? string.Empty
                    },
                    Role = role
                };

                return Ok(response);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Error interno del servidor: {ex.Message}");
            }
        }
    }
}
