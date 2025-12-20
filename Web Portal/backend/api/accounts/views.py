from django.contrib.auth.models import User
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from drf_spectacular.utils import extend_schema
from .serializers import UserListSerializer, UserCreateSerializer, PasswordChangeSerializer
from rest_framework.permissions import AllowAny
from rest_framework.decorators import permission_classes

@extend_schema(
    tags=['Users'],
    description="Retrieve all user accounts.",
    responses={200: UserListSerializer(many=True)}
)
@api_view(['GET'])
def getUsers(request):
    users = User.objects.all().order_by('id')
    serializer = UserListSerializer(users, many=True)
    return Response(serializer.data)


@extend_schema(
    tags=['Users'],
    description="Retrieve a single user by their ID.",
    responses={200: UserListSerializer, 404: {"type": "object"}}
)
@api_view(['GET'])
def getUserById(request, pk):
    try:
        user = User.objects.get(pk=pk)
    except User.DoesNotExist:
        return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
    serializer = UserListSerializer(user)
    return Response(serializer.data)


@extend_schema(
    tags=['Users'],
    description="Create a new user with username and password.",
    request=UserCreateSerializer,
    responses={201: UserListSerializer, 400: {"type": "object"}}
)
@api_view(['POST'])
@permission_classes([AllowAny])   
def createUser(request):
    serializer = UserCreateSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@extend_schema(
    tags=['Users'],
    description="Update an existing user's data (admin only).",
    request=UserListSerializer,
    responses={200: UserListSerializer, 404: {"type": "object"}}
)
@api_view(['PUT'])
def updateUser(request, pk):
    try:
        user = User.objects.get(pk=pk)
    except User.DoesNotExist:
        return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

    serializer = UserListSerializer(user, data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@extend_schema(
    tags=['Users'],
    description="Delete a user by ID (admin only).",
    responses={204: None, 404: {"type": "object"}}
)
@api_view(['DELETE'])
def deleteUser(request, pk):
    try:
        user = User.objects.get(pk=pk)
    except User.DoesNotExist:
        return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

    user.delete()
    return Response(status=status.HTTP_204_NO_CONTENT)


@extend_schema(
    tags=['Users'],
    description="Change a user's password (requires new_password field).",
    request=PasswordChangeSerializer,
    responses={200: {"type": "object", "properties": {"detail": {"type": "string"}}}},
)
@api_view(['PUT'])
def changePassword(request, pk):
    try:
        user = User.objects.get(pk=pk)
    except User.DoesNotExist:
        return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

    serializer = PasswordChangeSerializer(data=request.data)
    if serializer.is_valid():
        new_password = serializer.validated_data['new_password']
        user.set_password(new_password)
        user.save()
        return Response({'detail': 'Password updated.'})
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
