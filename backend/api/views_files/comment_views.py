from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from api.models import SocietyNews, NewsComment

from api.serializers import NewsCommentSerializer

from api.views_files.view_utility import (
    has_society_management_permission, is_society_member, standard_error_response,
    )


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
        
        # Check if user is a member
        if not is_society_member(request.user, society.id):
            return standard_error_response(
                "You must be a member of this society to view comments.",
                status.HTTP_403_FORBIDDEN
            )
            
        comments = NewsComment.objects.filter(news_post=news_post, parent_comment=None).order_by('created_at')
        serializer = NewsCommentSerializer(comments, many=True, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request, news_id):
        news_post = get_object_or_404(SocietyNews, id=news_id)
        society = news_post.society
        
        # Check if user is a student
        if not hasattr(request.user, 'student'):
            return standard_error_response(
                "Only students can comment.",
                status.HTTP_403_FORBIDDEN
            )
            
        student = request.user.student
        
        # Check if user is a member or officer
        is_member = student.societies.filter(id=society.id).exists() or \
                    student.societies_belongs_to.filter(id=society.id).exists()
        is_officer = has_society_management_permission(student, society)
        
        if not (is_member or is_officer):
            return standard_error_response(
                "You must be a member or officer of this society to comment.",
                status.HTTP_403_FORBIDDEN
            )
            
        # Process comment data
        parent_comment_id = request.data.get('parent_comment')
        data = {
            'content': request.data.get('content'),
            'parent_comment': parent_comment_id
        }
        
        serializer = NewsCommentSerializer(data=data, context={'request': request})
        if serializer.is_valid():
            # Check parent comment if replying
            if parent_comment_id:
                try:
                    parent_comment = NewsComment.objects.get(id=parent_comment_id)
                    if parent_comment.news_post.id != int(news_id):
                        return standard_error_response(
                            "Parent comment does not belong to this news post.",
                            status.HTTP_400_BAD_REQUEST
                        )
                except NewsComment.DoesNotExist:
                    return standard_error_response(
                        "Parent comment does not exist.",
                        status.HTTP_400_BAD_REQUEST
                    )
                    
            # Create the comment
            comment = serializer.save(news_post=news_post, user=request.user, parent_comment_id=parent_comment_id)
            return Response(
                NewsCommentSerializer(comment, context={'request': request}).data,
                status=status.HTTP_201_CREATED
            )
            
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
        
        # Only comment author can edit
        if comment.user.id != request.user.id:
            return standard_error_response(
                "You can only edit your own comments.",
                status.HTTP_403_FORBIDDEN
            )
        
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
        
        # Check if user is author or has management permissions
        is_author = (comment.user.id == request.user.id)
        is_officer = False
        if hasattr(request.user, 'student'):
            is_officer = has_society_management_permission(request.user.student, society)

        if not is_author and not is_officer:
            return standard_error_response(
                "You can only delete your own comments or moderate as a society officer.",
                status.HTTP_403_FORBIDDEN
            )
        
        comment.delete()
        return Response({"message": "Comment deleted successfully."}, status=status.HTTP_204_NO_CONTENT)


class NewsCommentLikeView(APIView):
    """API view for handling likes on news comments with appropriate permission checks."""
    permission_classes = [IsAuthenticated]

    def post(self, request, comment_id):
        try:
            comment = get_object_or_404(NewsComment, id=comment_id)
            news_post = comment.news_post
            society = news_post.society
            
            # Check if user is a member
            if not is_society_member(request.user, society.id):
                return standard_error_response(
                    "You must be a member of this society to like comments.",
                    status.HTTP_403_FORBIDDEN
                )

            # Toggle like status
            if comment.dislikes.filter(id=request.user.id).exists():
                comment.dislikes.remove(request.user)

            if comment.likes.filter(id=request.user.id).exists():
                comment.likes.remove(request.user)
                action = "unliked"
            else:
                comment.likes.add(request.user)
                action = "liked"

            return Response({
                "status": action,
                "likes_count": comment.likes.count(),
                "dislikes_count": comment.dislikes.count()
            }, status=status.HTTP_200_OK)
            
        except Exception:
            return standard_error_response("Comment not found.", status.HTTP_404_NOT_FOUND)


class NewsCommentDislikeView(APIView):
    """API view for handling dislikes on news comments with appropriate permission checks."""
    permission_classes = [IsAuthenticated]
    
    def post(self, request, comment_id):
        try:
            comment = get_object_or_404(NewsComment, id=comment_id)
            news_post = comment.news_post
            society = news_post.society
            
            # Check if user is a member
            if not is_society_member(request.user, society.id):
                return standard_error_response(
                    "You must be a member of this society to dislike comments.",
                    status.HTTP_403_FORBIDDEN
                )
                
            # Toggle dislike status
            if comment.likes.filter(id=request.user.id).exists():
                comment.likes.remove(request.user)
                
            if comment.dislikes.filter(id=request.user.id).exists():
                comment.dislikes.remove(request.user)
                action = "undisliked"
            else:
                comment.dislikes.add(request.user)
                action = "disliked"
                
            return Response({
                "status": action,
                "likes_count": comment.likes.count(),
                "dislikes_count": comment.dislikes.count()
            }, status=status.HTTP_200_OK)
        except Exception:
            return standard_error_response("Comment not found.", status.HTTP_404_NOT_FOUND)
