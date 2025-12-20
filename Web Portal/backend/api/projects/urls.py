from django.urls import path
from . import views

urlpatterns = [
    path('getProjectList', views.getProjects, name='project_list'),             
    path('getProjectById/<int:pk>', views.getProjectById, name='project_detail'),
    path('createProject', views.createProject, name='project_create'),  
    path('<int:pk>/updateProject', views.updateProject, name='project_update'),
    path('<int:pk>/setStatus', views.setProjectStatus, name='project_status'),
    path('<int:pk>/deleteProject', views.deleteProject, name='project_delete'),
]