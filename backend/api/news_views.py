from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from django.db.models import Manager
from api.models import Society, SocietyNews, NewsComment, Student, NewsPublicationRequest
from api.serializers import SocietyNewsSerializer, NewsCommentSerializer, NewsPublicationRequestSerializer
from api.views_files.view_utility import has_society_management_permission
import traceback


class SocietyNewsListView(APIView):
    """API view for handling society news list operations, including viewing and creating news posts."""
    permission_classes = [IsAuthenticated]
    
    def get(self, request, society_id):
        try:
            society = get_object_or_404(Society, id=society_id)
            
            is_member = False
            if hasattr(request.user, 'student'):
                student = request.user.student

                try:
                    societies = student.societies
                    if societies.filter(id=society_id).exists():
                        is_member = True
                except Exception:
                    pass

                if not is_member:
                    try:
                        societies_belongs_to = student.societies_belongs_to
                        if societies_belongs_to.filter(id=society_id).exists():
                            is_member = True
                    except Exception:
                        pass

                if hasattr(student, 'president_of') and student.president_of and student.president_of.id == society.id:
                    is_member = True

                try:
                    vp_society = getattr(student, 'vice_president_of_society', None)
                    if vp_society and vp_society.id == society.id:
                        is_member = True
                except Exception:
                    pass

                try:
                    is_officer = has_society_management_permission(student, society)
                except Exception:
                    is_officer = False

            if is_member:
                try:
                    if has_society_management_permission(request.user.student, society):
                        news_posts = SocietyNews.objects.filter(society=society)
                    else:
                        news_posts = SocietyNews.objects.filter(society=society, status="Published")

                    news_posts = news_posts.order_by('-is_pinned', '-created_at')
                    serializer = SocietyNewsSerializer(news_posts, many=True, context={'request': request})
                    
                    return Response(serializer.data, status=status.HTTP_200_OK)
                except Exception:
                    traceback.print_exc()
                    return Response({"error": "An error occurred processing news posts."}, 
                                    status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            else:
                return Response({"error": "You must be a member of this society to view its news."}, 
                                status=status.HTTP_403_FORBIDDEN)
        except Exception:
            traceback.print_exc()
            return Response({"error": "An unexpected error occurred."}, 
                            status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def post(self, request, society_id):
        request_data = request.data.copy()

        try:
            society = get_object_or_404(Society, id=society_id)
            if not hasattr(request.user, 'student'):
                return Response({"error": "Only society presidents and vice presidents can create news posts."},
                                status=status.HTTP_403_FORBIDDEN)

            is_officer = has_society_management_permission(request.user.student, society)
            if not is_officer:
                return Response({"error": "Only society presidents and vice presidents can create news posts."},
                                status=status.HTTP_403_FORBIDDEN)

            data = request_data.copy()
            data._mutable = True
            data['society'] = society.id

            if 'status' in data and data['status'] == 'Published':
                data['status'] = 'Draft'

            for field in ['is_pinned', 'is_featured']:
                if field in data:
                    data[field] = data[field].lower() == 'true'

            if 'tags' in data and isinstance(data['tags'], str):
                import json
                try:
                    data['tags'] = json.loads(data['tags'])
                except json.JSONDecodeError:
                    pass

            data._mutable = False
            serializer = SocietyNewsSerializer(data=data, context={'request': request})
            if serializer.is_valid():
                news_post = serializer.save(author=request.user.student)
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            else:
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class SocietyNewsDetailView(APIView):
    """API view for retrieving, updating, and deleting individual society news posts."""
    permission_classes = [IsAuthenticated]
    
    def get(self, request, news_id):
        news_post = get_object_or_404(SocietyNews, id=news_id)
        society = news_post.society

        if request.user.is_admin():
            pass
        else:
            is_member = False
            if hasattr(request.user, 'student'):
                is_member = request.user.student.societies.filter(id=society.id).exists()

            if not is_member:
                return Response({"error": "You must be a member of this society to view its news."}, 
                                status=status.HTTP_403_FORBIDDEN)

            if news_post.status != "Published":
                has_management = False
                if hasattr(request.user, 'student'):
                    has_management = has_society_management_permission(request.user.student, society)

                if not has_management:
                    return Response({"error": "This news post is not published."}, 
                                    status=status.HTTP_403_FORBIDDEN)

        news_post.increment_view_count()

        serializer = SocietyNewsSerializer(news_post, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)
    
    def put(self, request, news_id):
        news_post = get_object_or_404(SocietyNews, id=news_id)
        society = news_post.society
        
        if not hasattr(request.user, 'student') or not has_society_management_permission(request.user.student, society):
            return Response({"error": "Only society presidents and vice presidents can update news posts."}, 
                            status=status.HTTP_403_FORBIDDEN)
        
        data = request.data.copy() if hasattr(request.data, 'copy') else dict(request.data)
        
        current_status = news_post.status
        
        if 'status' in data:
            if request.user.is_admin():
                pass
            elif current_status == "Draft" and data['status'] == "Published":
                data['status'] = "Draft"
                return Response({
                    "error": "Cannot directly publish posts. Please use the 'Submit for Approval' feature.",
                    "code": "use_publication_request"
                }, status=status.HTTP_400_BAD_REQUEST)
            
            elif current_status == "PendingApproval" and data['status'] == "Draft":
                NewsPublicationRequest.objects.filter(
                    news_post=news_post,
                    status="Pending"
                ).update(status="Cancelled")
        
        serializer = SocietyNewsSerializer(news_post, data=data, partial=True, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        else:
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    def delete(self, request, news_id):
        news_post = get_object_or_404(SocietyNews, id=news_id)
        society = news_post.society
        
        if not hasattr(request.user, 'student') or not has_society_management_permission(request.user.student, society):
            return Response({"error": "Only society presidents and vice presidents can delete news posts."}, 
                            status=status.HTTP_403_FORBIDDEN)
        
        news_post.delete()
        return Response({"message": "News post deleted successfully."}, status=status.HTTP_204_NO_CONTENT)

class NewsCommentView(APIView):
    """
    API view for listing and creating comments on society news posts.
    Handles both top-level comments and replies, with appropriate permission checks
    to ensure only society members can view and create comments.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, news_id):
        news_post = get_object_or_404(SocietyNews, id=news_id)
        society = news_post.society
        is_member = False
        if hasattr(request.user, 'student'):
            student = request.user.student
            is_member = student.societies.filter(id=society.id).exists() or \
                        student.societies_belongs_to.filter(id=society.id).exists()
        if not is_member:
            return Response({"error": "You must be a member of this society to view comments."},
                            status=status.HTTP_403_FORBIDDEN)
        comments = NewsComment.objects.filter(news_post=news_post, parent_comment=None).order_by('created_at')
        serializer = NewsCommentSerializer(comments, many=True, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request, news_id):
        news_post = get_object_or_404(SocietyNews, id=news_id)
        society = news_post.society
        if not hasattr(request.user, 'student'):
            return Response({"error": "Only students can comment."}, status=status.HTTP_403_FORBIDDEN)
        student = request.user.student
        is_member = student.societies.filter(id=society.id).exists() or \
                    student.societies_belongs_to.filter(id=society.id).exists()
        is_officer = has_society_management_permission(student, society)
        if not (is_member or is_officer):
            return Response({"error": "You must be a member or officer of this society to comment."},
                            status=status.HTTP_403_FORBIDDEN)
        parent_comment_id = request.data.get('parent_comment')
        data = {
            'content': request.data.get('content'),
            'parent_comment': parent_comment_id
        }
        serializer = NewsCommentSerializer(data=data, context={'request': request})
        if serializer.is_valid():
            if parent_comment_id:
                try:
                    parent_comment = NewsComment.objects.get(id=parent_comment_id)
                    if parent_comment.news_post.id != int(news_id):
                        return Response({"error": "Parent comment does not belong to this news post."},
                                        status=status.HTTP_400_BAD_REQUEST)
                except NewsComment.DoesNotExist:
                    return Response({"error": "Parent comment does not exist."},
                                    status=status.HTTP_400_BAD_REQUEST)
            comment = serializer.save(news_post=news_post, user=request.user, parent_comment_id=parent_comment_id)
            return Response(NewsCommentSerializer(comment, context={'request': request}).data,
                            status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class NewsCommentDetailView(APIView):
    """
    API view for managing individual news comments, providing update and delete operations
    with appropriate permission checks. Authors can edit their own comments, while both 
    authors and society officers can delete comments.
    """
    permission_classes = [IsAuthenticated]
    
    def put(self, request, comment_id):
        """
        Edit a comment (author only).
        """
        comment = get_object_or_404(NewsComment, id=comment_id)
        if comment.user.id != request.user.id:
            return Response({"error": "You can only edit your own comments."}, 
                            status=status.HTTP_403_FORBIDDEN)
        
        serializer = NewsCommentSerializer(comment, data=request.data, partial=True, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    def delete(self, request, comment_id):
        """
        Delete a comment (author or officer).
        """
        comment = get_object_or_404(NewsComment, id=comment_id)
        news_post = comment.news_post
        society = news_post.society
        
        is_author = (comment.user.id == request.user.id)
        is_officer = False
        if hasattr(request.user, 'student'):
            is_officer = has_society_management_permission(request.user.student, society)

        if not is_author and not is_officer:
            return Response({"error": "You can only delete your own comments or moderate as a society officer."}, 
                            status=status.HTTP_403_FORBIDDEN)
        
        comment.delete()
        return Response({"message": "Comment deleted successfully."}, status=status.HTTP_204_NO_CONTENT)


class NewsCommentLikeView(APIView):
    """API view for handling likes on news comments with appropriate permission checks."""
    permission_classes = [IsAuthenticated]

    def post(self, request, comment_id):
        try:
            comment = get_object_or_404(NewsComment, id=comment_id)
        except Exception:
            return Response({"error": "Comment not found."}, status=status.HTTP_404_NOT_FOUND)

        try:
            news_post = comment.news_post
            society = news_post.society
        except Exception:
            return Response({"error": "News post or society not found."}, status=status.HTTP_404_NOT_FOUND)

        # Check membership
        is_member = False
        if hasattr(request.user, 'student'):
            student = request.user.student
            try:
                is_member = student.societies.filter(id=society.id).exists()
                if not is_member:
                    is_member = student.societies_belongs_to.filter(id=society.id).exists()
            except Exception:
                pass

        if not is_member:
            return Response({"error": "You must be a member of this society to like comments."}, status=status.HTTP_403_FORBIDDEN)

        # Remove from dislikes if present
        if comment.dislikes.filter(id=request.user.id).exists():
            comment.dislikes.remove(request.user)

        # Toggle like
        if comment.likes.filter(id=request.user.id).exists():
            comment.likes.remove(request.user)
            action = "unliked"
        else:
            comment.likes.add(request.user)
            action = "liked"

        final_likes = comment.likes.count()
        final_dislikes = comment.dislikes.count()

        return Response({
            "status": action,
            "likes_count": final_likes,
            "dislikes_count": final_dislikes
        }, status=status.HTTP_200_OK)


class NewsCommentDislikeView(APIView):
    """API view for handling dislikes on news comments with appropriate permission checks."""
    permission_classes = [IsAuthenticated]

    def post(self, request, comment_id):
        try:
            comment = get_object_or_404(NewsComment, id=comment_id)
        except Exception:
            return Response({"error": "Comment not found."}, status=status.HTTP_404_NOT_FOUND)

        try:
            news_post = comment.news_post
            society = news_post.society
        except Exception:
            return Response({"error": "News post or society not found."}, status=status.HTTP_404_NOT_FOUND)

        # Check membership
        is_member = False
        if hasattr(request.user, 'student'):
            student = request.user.student
            try:
                is_member = student.societies.filter(id=society.id).exists()
                if not is_member:
                    is_member = student.societies_belongs_to.filter(id=society.id).exists()
            except Exception:
                pass

        if not is_member:
            return Response({"error": "You must be a member of this society to dislike comments."}, status=status.HTTP_403_FORBIDDEN)

        # Remove from likes if present
        if comment.likes.filter(id=request.user.id).exists():
            comment.likes.remove(request.user)

        # Toggle dislike
        if comment.dislikes.filter(id=request.user.id).exists():
            comment.dislikes.remove(request.user)
            action = "undisliked"
        else:
            comment.dislikes.add(request.user)
            action = "disliked"

        final_likes = comment.likes.count()
        final_dislikes = comment.dislikes.count()

        return Response({
            "status": action,
            "likes_count": final_likes,
            "dislikes_count": final_dislikes
        }, status=status.HTTP_200_OK)


class MemberNewsView(APIView):
    """
    API view for retrieving published news posts from all societies that a student is a
    member of.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not hasattr(request.user, 'student'):
            return Response({"error": "Only students can access this view."}, status=status.HTTP_403_FORBIDDEN)

        student = request.user.student
        student_societies = student.societies.all()
        
        if not student_societies.exists():
            student_societies = student.societies_belongs_to.all()

        if not student_societies.exists():
            return Response([], status=status.HTTP_200_OK)

        news_posts = SocietyNews.objects.filter(
            society__in=student_societies, 
            status="Published"
        ).order_by('-is_pinned', '-created_at')

        serializer = SocietyNewsSerializer(news_posts, many=True, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)