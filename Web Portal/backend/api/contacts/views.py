from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from drf_spectacular.utils import extend_schema
from .models import ContactMessage
from .serializers import ContactMessageSerializer

@extend_schema(
    tags=['Contact'],
    description="Submit a contact message through the form.",
    request=ContactMessageSerializer,
    responses={201: ContactMessageSerializer, 400: {"type": "object"}}
)
@api_view(['POST'])
def sendMessage(request):
    serializer = ContactMessageSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@extend_schema(
    tags=['Contact'],
    description="Retrieve all contact messages (admin only).",
    responses={200: ContactMessageSerializer(many=True)}
)
@api_view(['GET'])
def getMessages(request):
    messages = ContactMessage.objects.all().order_by('-created_at')
    serializer = ContactMessageSerializer(messages, many=True)
    return Response(serializer.data)

@extend_schema(
    tags=['Contact'],
    description="Retrieve a single contact message by ID.",
    responses={200: ContactMessageSerializer, 404: {"type": "object"}}
)
@api_view(['GET'])
def getMessageById(request, pk):
    try:
        message = ContactMessage.objects.get(pk=pk)
    except ContactMessage.DoesNotExist:
        return Response({'error': 'Message not found'}, status=status.HTTP_404_NOT_FOUND)

    serializer = ContactMessageSerializer(message)
    return Response(serializer.data)

@extend_schema(
    tags=['Contact'],
    description="Delete a contact message by ID (admin only).",
    responses={204: None, 404: {"type": "object"}}
)
@api_view(['DELETE'])
def deleteMessage(request, pk):
    try:
        message = ContactMessage.objects.get(pk=pk)
    except ContactMessage.DoesNotExist:
        return Response({'error': 'Message not found'}, status=status.HTTP_404_NOT_FOUND)

    message.delete()
    return Response(status=status.HTTP_204_NO_CONTENT)
