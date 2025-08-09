using Microsoft.AspNetCore.Identity;

namespace Sagat_To_Do_List.Entities
{
    public class Comments
    {
        public int Id { get; set; }
        public string Comment { get; set; } = string.Empty;
        public bool IsUpdated { get; set; }
        public int TaskId { get; set; }
        public Tasks Task { get; set; } = null!;
        public string CreatedByUserId { get; set; } = string.Empty;
        public IdentityUser CreatedByUser { get; set; } = null!;
        public int? ParentCommentId { get; set; }
        public Comments? ParentComment { get; set; }
        public List<Comments> Replies { get; set; } = new List<Comments>();
    }
}
