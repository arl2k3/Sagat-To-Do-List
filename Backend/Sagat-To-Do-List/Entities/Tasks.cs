using Microsoft.AspNetCore.Identity;

namespace Sagat_To_Do_List.Entities
{
    public class Tasks
    {
        public int Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public bool IsCompleted { get; set; }
        public string CreatedByUserId { get; set; } = string.Empty;
        public IdentityUser CreatedByUser { get; set; } = null!;
        public List<Comments> Comments { get; set; } = new List<Comments>();
    }
}