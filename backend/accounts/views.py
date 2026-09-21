from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView


class MeView(APIView):
    """Who am I? Also a cheap way for the frontend to check that a token still works."""

    def get(self, request):
        return Response({"id": request.user.id, "username": request.user.username})


class HealthView(APIView):
    """Public liveness check for the hosting platform. Deliberately doesn't touch the database,
    so frequent checks don't keep a serverless database awake."""

    authentication_classes = []
    permission_classes = [AllowAny]

    def get(self, request):
        return Response({"status": "ok"})
