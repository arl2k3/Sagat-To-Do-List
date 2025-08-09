namespace Sagat_To_Do_List.DTOs
{
    public class CommentDto
    {
        public int Id { get; set; }
        public string Comment { get; set; } = string.Empty;
        public bool IsUpdated { get; set; }
        public int TaskId { get; set; }
        public int? ParentCommentId { get; set; }
        public string CreatedByUserId { get; set; } = string.Empty;
        public List<CommentDto> Replies { get; set; } = new List<CommentDto>();
    }
    public class CreateCommentDto
    {
        public string Comment { get; set; } = string.Empty;
        public int TaskId { get; set; }
        public int? ParentCommentId { get; set; }
    }
    public class UpdateCommentDto
    {
        public string Comment { get; set; } = string.Empty;
    }
}
