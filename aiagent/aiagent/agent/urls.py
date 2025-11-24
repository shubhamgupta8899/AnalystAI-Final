from django.urls import path
from .views import QueryView, FollowupView, SessionDetailView

urlpatterns = [
    path("query/", QueryView.as_view(), name="api-query"),
    path("followup/", FollowupView.as_view(), name="api-followup"),
    path("session/<uuid:session_id>/", SessionDetailView.as_view(), name="api-session"),
]
