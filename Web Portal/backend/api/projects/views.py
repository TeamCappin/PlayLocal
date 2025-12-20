from rest_framework.decorators import api_view
from rest_framework.response import Response
from drf_spectacular.utils import extend_schema
from .models import Project
from .serializers import ProjectSerializer
from drf_spectacular.utils import OpenApiExample, OpenApiTypes, OpenApiRequest
from drf_spectacular.utils import OpenApiExample

@extend_schema(
    tags=['Projects'],
    description="Retrieve a list of all projects with full details.",
    responses={200: ProjectSerializer}
)
@api_view(['GET'])
def getProjects(request):
    projects = Project.objects.all()
    serializer = ProjectSerializer(projects, many=True)
    return Response(serializer.data)

@extend_schema(
    tags=['Projects'],
    description="Retrieve a single project by its ID.",
    responses={200: ProjectSerializer}
)
@api_view(['GET'])
def getProjectById(request, pk):
    try:
        project = Project.objects.get(pk=pk)
    except Project.DoesNotExist:
        return Response({'error': 'Project not found'}, status=404)

    serializer = ProjectSerializer(project)
    return Response(serializer.data)

@extend_schema(
    tags=['Projects'],
    request=ProjectSerializer,           # makes fields appear in Swagger
    responses={201: ProjectSerializer}   # document 201 response
)
@api_view(['POST'])
def createProject(request):
    serializer = ProjectSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=201)
    return Response(serializer.errors, status=400)

@extend_schema(
    tags=['Projects'],
    description="Change project status by integer enum ID (0=Planned, 1=In Progress, 2=Completed, 3=Cancelled).",
    request={
        'application/json': {
            'type': 'object',
            'properties': {
                'projectStatus': {'type': 'integer', 'enum': [0,1,2,3]}
            },
            'required': ['projectStatus']
        }
    },
    responses={200: ProjectSerializer}
)
@api_view(['PUT'])
def setProjectStatus(request, pk):
    try:
        project = Project.objects.get(pk=pk)
    except Project.DoesNotExist:
        return Response({'error': 'Project not found'}, status=404)

    new_status = request.data.get('projectStatus')
    valid_choices = [choice[0] for choice in Project._meta.get_field('projectStatus').choices]
    if new_status not in valid_choices:
        return Response({'error': f'Invalid status. Must be one of {valid_choices}'}, status=400)

    project.projectStatus = new_status
    project.save()
    serializer = ProjectSerializer(project)
    return Response(serializer.data)

@extend_schema(
    tags=['Projects'],
    description=(
        "Update an existing project's data (address, district, type, decisionStatus, "
        "projectStatus, architect, units, floors, etc.). "
        "All fields are validated and updated."
    ),
    request=ProjectSerializer,
    responses={200: ProjectSerializer},
)
@api_view(['PUT'])
def updateProject(request, pk):
    try:
        project = Project.objects.get(pk=pk)
    except Project.DoesNotExist:
        return Response({'error': 'Project not found'}, status=404)

    serializer = ProjectSerializer(project, data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=200)
    return Response(serializer.errors, status=400)

@extend_schema(
    tags=['Projects'],
    description="Delete a project by its ID. Returns 204 No Content if successful.",
    responses={204: OpenApiTypes.NONE, 404: OpenApiTypes.OBJECT}
)
@api_view(['DELETE'])
def deleteProject(request, pk):
    """
    Delete an existing project by ID.
    """
    try:
        project = Project.objects.get(pk=pk)
    except Project.DoesNotExist:
        return Response({'error': 'Project not found'}, status=status.HTTP_404_NOT_FOUND)

    project.delete()
    return Response(status=status.HTTP_204_NO_CONTENT)