use serde::{Deserialize, Serialize};

use super::projection::ProjectionContent;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ServiceProgram {
    pub id: i64,
    pub title: String,
    pub service_date: Option<String>,
    pub notes: Option<String>,
    pub is_active: bool,
    pub created_at: String,
    pub updated_at: String,
    pub deleted_at: Option<String>,
    pub items: Vec<ServiceItem>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ServiceProgramInput {
    pub title: String,
    pub service_date: Option<String>,
    pub notes: Option<String>,
    pub is_active: Option<bool>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ServiceItem {
    pub id: i64,
    pub service_program_id: i64,
    pub item_type: String,
    pub title: String,
    pub linked_entity_id: Option<i64>,
    pub custom_content_json: Option<ProjectionContent>,
    pub position: i64,
    pub created_at: String,
    pub updated_at: String,
    pub deleted_at: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ServiceItemInput {
    pub service_program_id: i64,
    pub item_type: String,
    pub title: String,
    pub linked_entity_id: Option<i64>,
    pub custom_content_json: Option<ProjectionContent>,
    pub position: Option<i64>,
}
