from random import randint
from api.models import AdminReportRequest, Student
from api.management.commands.seeding.comment_generator import RandomCommentDataGenerator

def create_report(society, student, report_type, i):
    """Creates an individual report"""
    is_from_society_officer = True if student==society.president else False
    email = student.email
    from_student = student

    report = AdminReportRequest.objects.create(
        report_type=report_type,
        subject=f"Sample Report {i+1}",
        details=f"This is the detailed description for report {i+1}.",
        is_from_society_officer=is_from_society_officer,
        email=email,
        from_student=from_student,
    )
    return report

def get_model_entries_as_list(model):
    """Get all the entries from a model as a single list"""
    return list(model.objects.all())

def get_active_students():
    """Get all students marked as active"""
    return Student.objects.filter(is_active=True)

def assign_comment_parent(comment, parent):
    """Assigns a parent comment to a comment"""
    if parent:
        comment.parent_comment = parent
        comment.save()

def get_comment_data(parent, past=False):
    """Gets the content for a comment"""
    generator = RandomCommentDataGenerator()
    if parent:
        data = generator.generate_reply()
    else:
        data = generator.generate_comment(past)
    return data["content"]

def like_dislike_comments(comment, society_members):
    """Applies likes and dislike to a comment"""
    like_num = randint(0, 5)
    comment.likes.add(*society_members[:min(like_num, len(society_members))])
    if like_num < len(society_members):
        dislike_num = like_num + randint(0, 5)
        comment.dislikes.add(*society_members[like_num:min(dislike_num, len(society_members))])
    comment.save()
