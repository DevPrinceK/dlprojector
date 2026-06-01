use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Personality {
    pub id: i64,
    pub full_name: String,
    pub department: Option<String>,
    pub role: Option<String>,
    pub favorite_scripture: Option<String>,
    pub short_bio: Option<String>,
    pub photo_path: Option<String>,
    pub week_date: Option<String>,
    pub is_active: bool,
    pub created_at: String,
    pub updated_at: String,
    pub deleted_at: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PersonalityInput {
    pub full_name: String,
    pub department: Option<String>,
    pub role: Option<String>,
    pub favorite_scripture: Option<String>,
    pub short_bio: Option<String>,
    pub photo_path: Option<String>,
    pub week_date: Option<String>,
    pub is_active: Option<bool>,
}
