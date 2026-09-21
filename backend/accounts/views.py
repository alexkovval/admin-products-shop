from rest_framework.response import Response
from rest_framework.views import APIView


class MeView(APIView):
    """Who am I? Also a cheap way for the frontend to check that a token still works."""

    def get(self, request):
        return Response({"id": request.user.id, "username": request.user.username})
