from django.urls import path
from . import views

urlpatterns = [
    path('getUsersList', views.getUsers, name='get_users'),
    path('getUserById/<int:pk>', views.getUserById, name='get_user_by_id'),
    path('createUser', views.createUser, name='create_user'),
    path('updateUser/<int:pk>', views.updateUser, name='update_user'),
    path('changePassword/<int:pk>', views.changePassword, name='change_password'),
    path('deleteUser/<int:pk>', views.deleteUser, name='delete_user'),
]
