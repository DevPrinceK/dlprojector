use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Announcement {
    pub id: i64,
    pub title: String,
    pub message: String,
    pub event_date: Option<String>,
    pub event_time: Option<String>,
    pub venue: Option<String>,
    pub image_path: Option<String>,
    pub category: Option<String>,
    pub is_active: bool,
    pub created_at: String,
    pub updated_at: String,
    pub deleted_at: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AnnouncementInput {
    pub title: String,
    pub message: String,
    pub event_date: Option<String>,
    pub event_time: Option<String>,
    pub venue: Option<String>,
    pub image_path: Option<String>,
    pub category: Option<String>,
    pub is_active: Option<bool>,
}
