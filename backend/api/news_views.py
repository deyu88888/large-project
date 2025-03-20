from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from django.db.models import Manager
from api.models import Society, SocietyNews, NewsComment, Student
from api.serializers import SocietyNewsSerializer, NewsCommentSerializer

def has_society_management_permission(student, society):
    print("\n" + "=" * 80)
    print("DEBUG - CHECKING MANAGEMENT PERMISSIONS")
    print(f"DEBUG - Student: ID={student.id}, Username={student.username}")
    print(f"DEBUG - Society: ID={society.id}, Name={society.name}")
    
    student_is_president = getattr(student, 'is_president', False)
    print(f"DEBUG - student.is_president={student_is_president}")
    
    has_president_attr = hasattr(society, 'president')
    print(f"DEBUG - society has president attribute: {has_president_attr}")
    
    society_president = getattr(society, 'president', None)
    society_president_id = getattr(society_president, 'id', None)
    student_id = getattr(student, 'id', None)
    
    print(f"DEBUG - society.president: {society_president}")
    print(f"DEBUG - president ID: {society_president_id}, student ID: {student_id}")
    is_president = student_is_president and has_president_attr and society_president and society_president_id == student_id
    print(f"DEBUG - is_president check result: {is_president}")
    
    has_vp_attr = hasattr(society, 'vice_president')
    society_vp = getattr(society, 'vice_president', None)
    society_vp_id = getattr(society_vp, 'id', None)
    
    print(f"DEBUG - society.vice_president: {society_vp}")
    print(f"DEBUG - vice president ID: {society_vp_id}, student ID: {student_id}")
    is_vice_president = has_vp_attr and society_vp and society_vp_id == student_id
    print(f"DEBUG - is_vice_president check result: {is_vice_president}")
    
    result = is_president or is_vice_president
    print(f"DEBUG - Final permission result: {result}")
    print("=" * 80)
    return result


class SocietyNewsListView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request, society_id):
        print("\n" + "=" * 80)
        print(f"DEBUG - SocietyNewsListView GET request at {timezone.now()}")
        print(f"DEBUG - Request URL: {request.path}")
        print(f"DEBUG - Query params: {request.query_params}")
        print(f"DEBUG - Auth header: {request.headers.get('Authorization', 'None')}")
        print(f"DEBUG - Society ID requested: {society_id}")
        print(f"DEBUG - User ID: {request.user.id}, Username: {request.user.username}")

        try:
            society = get_object_or_404(Society, id=society_id)
            print(f"DEBUG - Society found: ID={society.id}, Name={society.name}")
            
            is_member = False
            if hasattr(request.user, 'student'):
                student = request.user.student
                print(f"DEBUG - User has student attribute: {student}")

                try:
                    societies = student.societies
                    print(f"DEBUG - Checking membership via student.societies")
                    if societies.filter(id=society_id).exists():
                        is_member = True
                except Exception as e:
                    print(f"DEBUG - Error accessing student.societies: {str(e)}")

                if not is_member:
                    try:
                        societies_belongs_to = student.societies_belongs_to
                        print(f"DEBUG - Checking membership via student.societies_belongs_to")
                        if societies_belongs_to.filter(id=society_id).exists():
                            is_member = True
                    except Exception as e:
                        print(f"DEBUG - Error accessing student.societies_belongs_to: {str(e)}")

                if hasattr(student, 'president_of') and student.president_of and student.president_of.id == society.id:
                    print("DEBUG - Student is president")
                    is_member = True

                try:
                    vp_society = getattr(student, 'vice_president_of_society', None)
                    if vp_society and vp_society.id == society.id:
                        print("DEBUG - Student is vice president")
                        is_member = True
                except Exception as e:
                    print(f"DEBUG - Error checking VP relationship: {str(e)}")

                try:
                    is_officer = has_society_management_permission(student, society)
                except Exception as e:
                    print(f"DEBUG - Error checking management permissions: {str(e)}")
                    is_officer = False
            else:
                print("DEBUG - User does not have student attribute")

            print(f"DEBUG - FINAL MEMBERSHIP STATUS: {is_member}")

            if is_member:
                try:
                    if has_society_management_permission(request.user.student, society):
                        print("DEBUG - User is an officer, returning all posts")
                        news_posts = SocietyNews.objects.filter(society=society)
                    else:
                        print("DEBUG - User is a regular member, returning published posts only")
                        news_posts = SocietyNews.objects.filter(society=society, status="Published")

                    news_posts = news_posts.order_by('-is_pinned', '-created_at')
                    serializer = SocietyNewsSerializer(news_posts, many=True, context={'request': request})
                    print("DEBUG - Returning serialized data")
                    print("=" * 80)
                    return Response(serializer.data, status=status.HTTP_200_OK)
                except Exception as e:
                    print(f"DEBUG - Error processing news posts: {str(e)}")
                    return Response({"error": "An error occurred processing news posts."}, 
                                    status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            else:
                print("DEBUG - User is not a member, access forbidden")
                print("=" * 80)
                return Response({"error": "You must be a member of this society to view its news."}, 
                                status=status.HTTP_403_FORBIDDEN)
        except Exception as e:
            print(f"DEBUG - Unexpected error: {str(e)}")
            return Response({"error": "An unexpected error occurred."}, 
                            status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def post(self, request, society_id):
        print("\n" + "=" * 80)
        print(f"DEBUG - SocietyNewsListView POST request at {timezone.now()}")
        print(f"DEBUG - Society ID: {society_id}")

        request_data = request.data.copy()
        print(f"DEBUG - Request data: {request_data}")

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
            print(f"DEBUG - Unexpected error in POST: {str(e)}")
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class SocietyNewsDetailView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request, news_id):
        news_post = get_object_or_404(SocietyNews, id=news_id)
        society = news_post.society

        is_member = False
        if hasattr(request.user, 'student'):
            is_member = request.user.student.societies.filter(id=society.id).exists()

        if not is_member:
            return Response({"error": "You must be a member of this society to view its news."}, 
                           status=status.HTTP_403_FORBIDDEN)

        if news_post.status != "Published" and not has_society_management_permission(request.user.student, society):
            return Response({"error": "This news post is not published."}, 
                           status=status.HTTP_403_FORBIDDEN)

        # Use the model method to increment view count
        news_post.increment_view_count()

        serializer = SocietyNewsSerializer(news_post, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)
    
    def put(self, request, news_id):
        news_post = get_object_or_404(SocietyNews, id=news_id)
        society = news_post.society
        
        if not hasattr(request.user, 'student') or not has_society_management_permission(request.user.student, society):
            return Response({"error": "Only society presidents and vice presidents can update news posts."}, 
                           status=status.HTTP_403_FORBIDDEN)

        serializer = SocietyNewsSerializer(news_post, data=request.data, partial=True, context={'request': request})
        if serializer.is_valid():
            if news_post.status != "Published" and request.data.get('status') == "Published":
                serializer.save(published_at=timezone.now())
            else:
                serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        
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
    permission_classes = [IsAuthenticated]

    def post(self, request, comment_id):
        print("\n" + "="*80)
        print("DEBUG - Entering NewsCommentLikeView.post")
        print("DEBUG - Request user:", request.user)
        print("DEBUG - Request headers:", request.headers)
        print("DEBUG - Comment ID from URL:", comment_id)

        try:
            comment = get_object_or_404(NewsComment, id=comment_id)
            print("DEBUG - Retrieved comment:", comment)
        except Exception as e:
            print("DEBUG - Error retrieving comment:", e)
            return Response({"error": "Comment not found."}, status=status.HTTP_404_NOT_FOUND)

        try:
            news_post = comment.news_post
            society = news_post.society
            print("DEBUG - News post ID:", news_post.id)
            print("DEBUG - Society ID:", society.id)
        except Exception as e:
            print("DEBUG - Error retrieving news_post or society:", e)
            return Response({"error": "News post or society not found."}, status=status.HTTP_404_NOT_FOUND)

        # Check membership
        is_member = False
        if hasattr(request.user, 'student'):
            student = request.user.student
            print("DEBUG - Request user is a student (ID: {})".format(student.id))
            try:
                is_member = student.societies.filter(id=society.id).exists()
                print("DEBUG - Membership via student.societies:", is_member)
                if not is_member:
                    is_member = student.societies_belongs_to.filter(id=society.id).exists()
                    print("DEBUG - Membership via student.societies_belongs_to:", is_member)
            except Exception as e:
                print("DEBUG - Error during membership check:", e)
        else:
            print("DEBUG - Request user does not have a student attribute.")

        if not is_member:
            print("DEBUG - User is not a member of this society. Returning 403.")
            return Response({"error": "You must be a member of this society to like comments."}, status=status.HTTP_403_FORBIDDEN)
        print("DEBUG - Membership verified.")

        # Log initial counts
        initial_likes = comment.likes.count()
        initial_dislikes = comment.dislikes.count()
        print("DEBUG - Initial likes count:", initial_likes)
        print("DEBUG - Initial dislikes count:", initial_dislikes)

        # Remove from dislikes if present
        if comment.dislikes.filter(id=request.user.id).exists():
            print("DEBUG - User had disliked this comment. Removing dislike.")
            comment.dislikes.remove(request.user)

        # Toggle like
        if comment.likes.filter(id=request.user.id).exists():
            print("DEBUG - User already liked this comment. Removing like.")
            comment.likes.remove(request.user)
            action = "unliked"
        else:
            print("DEBUG - User has not liked this comment yet. Adding like.")
            comment.likes.add(request.user)
            action = "liked"

        # Log final counts
        final_likes = comment.likes.count()
        final_dislikes = comment.dislikes.count()
        print("DEBUG - Final likes count:", final_likes)
        print("DEBUG - Final dislikes count:", final_dislikes)
        print("DEBUG - Like action performed:", action)
        print("="*80)

        return Response({
            "status": action,
            "likes_count": final_likes,
            "dislikes_count": final_dislikes
        }, status=status.HTTP_200_OK)


class NewsCommentDislikeView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, comment_id):
        print("\n" + "="*80)
        print("DEBUG - Entering NewsCommentDislikeView.post")
        print("DEBUG - Request user:", request.user)
        print("DEBUG - Request headers:", request.headers)
        print("DEBUG - Comment ID from URL:", comment_id)

        try:
            comment = get_object_or_404(NewsComment, id=comment_id)
            print("DEBUG - Retrieved comment:", comment)
        except Exception as e:
            print("DEBUG - Error retrieving comment:", e)
            return Response({"error": "Comment not found."}, status=status.HTTP_404_NOT_FOUND)

        try:
            news_post = comment.news_post
            society = news_post.society
            print("DEBUG - News post ID:", news_post.id)
            print("DEBUG - Society ID:", society.id)
        except Exception as e:
            print("DEBUG - Error retrieving news_post or society:", e)
            return Response({"error": "News post or society not found."}, status=status.HTTP_404_NOT_FOUND)

        # Check membership
        is_member = False
        if hasattr(request.user, 'student'):
            student = request.user.student
            print("DEBUG - Request user is a student (ID: {})".format(student.id))
            try:
                is_member = student.societies.filter(id=society.id).exists()
                print("DEBUG - Membership via student.societies:", is_member)
                if not is_member:
                    is_member = student.societies_belongs_to.filter(id=society.id).exists()
                    print("DEBUG - Membership via student.societies_belongs_to:", is_member)
            except Exception as e:
                print("DEBUG - Error during membership check:", e)
        else:
            print("DEBUG - Request user does not have a student attribute.")

        if not is_member:
            print("DEBUG - User is not a member of this society. Returning 403.")
            return Response({"error": "You must be a member of this society to dislike comments."}, status=status.HTTP_403_FORBIDDEN)
        print("DEBUG - Membership verified.")

        # Log initial counts
        initial_likes = comment.likes.count()
        initial_dislikes = comment.dislikes.count()
        print("DEBUG - Initial likes count:", initial_likes)
        print("DEBUG - Initial dislikes count:", initial_dislikes)

        # Remove from likes if present
        if comment.likes.filter(id=request.user.id).exists():
            print("DEBUG - User had liked this comment. Removing like.")
            comment.likes.remove(request.user)

        # Toggle dislike
        if comment.dislikes.filter(id=request.user.id).exists():
            print("DEBUG - User already disliked this comment. Removing dislike.")
            comment.dislikes.remove(request.user)
            action = "undisliked"
        else:
            print("DEBUG - User has not disliked this comment yet. Adding dislike.")
            comment.dislikes.add(request.user)
            action = "disliked"

        # Log final counts
        final_likes = comment.likes.count()
        final_dislikes = comment.dislikes.count()
        print("DEBUG - Final likes count:", final_likes)
        print("DEBUG - Final dislikes count:", final_dislikes)
        print("DEBUG - Dislike action performed:", action)
        print("="*80)

        return Response({
            "status": action,
            "likes_count": final_likes,
            "dislikes_count": final_dislikes
        }, status=status.HTTP_200_OK)


class MemberNewsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        print("\n" + "=" * 80)
        print(f"DEBUG - MemberNewsView GET request at {timezone.now()}")
        print(f"DEBUG - Request URL: {request.path}")
        print(f"DEBUG - Query Params: {request.query_params}")
        print(f"DEBUG - Authenticated User: {request.user.username} (ID: {request.user.id})")

        if not hasattr(request.user, 'student'):
            return Response({"error": "Only students can access this view."}, status=status.HTTP_403_FORBIDDEN)

        student = request.user.student
        print(f"DEBUG - Student ID: {student.id}")

        student_attrs = {}
        for attr in dir(student):
            if attr.startswith('_'):
                continue
            try:
                value = getattr(student, attr)
                if callable(value) or isinstance(value, Manager):
                    continue
                student_attrs[attr] = value
            except Exception as e:
                student_attrs[attr] = f"Error accessing attribute: {e}"
        print("DEBUG - Student attributes:", student_attrs)

        student_societies = student.societies.all()
        if not student_societies.exists():
            print("DEBUG - 'societies' relationship is empty; trying 'societies_belongs_to'")
            student_societies = student.societies_belongs_to.all()

        society_ids = list(student_societies.values_list("id", flat=True))
        print(f"DEBUG - Student is a member of societies: {society_ids}")
        if not student_societies.exists():
            print("DEBUG - Student is not a member of any society.")
            return Response([], status=status.HTTP_200_OK)

        news_posts = SocietyNews.objects.filter(society__in=student_societies, status="Published").order_by('-is_pinned', '-created_at')

        print("DEBUG - Constructed SQL Query for news_posts:")
        print(news_posts.query)

        count_posts = news_posts.count()
        print(f"DEBUG - Found {count_posts} published posts.")

        if count_posts > 0:
            for post in news_posts[:5]:
                print(f"DEBUG - ID={post.id}, Title={post.title}, Published At={post.published_at}")

        serializer = SocietyNewsSerializer(news_posts, many=True, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)