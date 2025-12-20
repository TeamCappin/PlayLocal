from django.urls import path
from . import views

urlpatterns = [
    path('sendMessage/', views.sendMessage, name='send_message'),
    path('getMessagesList', views.getMessages, name='get_messages'),
    path('getMessagesById/<int:pk>', views.getMessageById, name='get_message_by_id'),
    path('deleteMessage/<int:pk>/delete', views.deleteMessage, name='delete_message'),
]
