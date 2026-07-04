use anyhow::{anyhow, Result};
use rand::RngExt;
use serde_json::{json, Value};

/// Raw ubus JSON-RPC call
pub async fn ubus_call(
    base_url: &str,
    session: &str,
    object: &str,
    method: &str,
    params: Option<Value>,
) -> Result<Value> {
    let client = reqwest::Client::new();
    let url = format!("{}/ubus", base_url);

    let mut rpc_params = vec![
        Value::String(session.to_string()),
        Value::String(object.to_string()),
        Value::String(method.to_string()),
    ];

    // ubus requires 4th param even if empty
    rpc_params.push(params.unwrap_or(json!({})));

    let body = json!({
        "jsonrpc": "2.0",
        "id": chrono::Utc::now().timestamp_millis(),
        "method": "call",
        "params": rpc_params,
    });

    let resp = client
        .post(&url)
        .header("Content-Type", "application/json")
        .json(&body)
        .send()
        .await?
        .json::<Value>()
        .await?;

    // Check for JSON-RPC error
    if let Some(error) = resp.get("error") {
        let code = error["code"].as_i64().unwrap_or(-1);
        let msg = error["message"].as_str().unwrap_or("Unknown");
        return Err(anyhow!("RPC error [{}]: {}", code, msg));
    }

    // Extract result: [ubus_code, payload]
    let result = resp["result"]
        .as_array()
        .ok_or_else(|| anyhow!("Missing result"))?;

    let ubus_code = result
        .first()
        .and_then(|v| v.as_i64())
        .ok_or_else(|| anyhow!("Missing ubus code"))?;

    if ubus_code != 0 {
        return Err(anyhow!("ubus error code: {}", ubus_code));
    }

    let payload = result
        .get(1)
        .ok_or_else(|| anyhow!("Missing payload"))?;

    Ok(payload.clone())
}

/// Login via ubus session.login
pub async fn login(base_url: &str, username: &str, password: &str) -> Result<String> {
    let result: Value = ubus_call(base_url, "00000000000000000000000000000000", "session", "login", Some(json!({
        "username": username,
        "password": password,
        "timeout": 3600,
    })))
    .await?;

    let session = result["ubus_rpc_session"]
        .as_str()
        .ok_or_else(|| anyhow!("Login failed: no session token"))?
        .to_string();

    // Set CSRF token like LuCI does
    let token = (0..32).map(|_| {
        let chars: &[u8] = b"abcdef0123456789";
        chars[rand::rng().random_range(0..16)] as char
    }).collect::<String>();

    let _ = ubus_call(base_url, &session, "session", "set", Some(json!({
        "ubus_rpc_session": session,
        "values": { "token": token }
    })))
    .await;

    Ok(session)
}

/// Get system board info
pub async fn get_system_board(base_url: &str, session: &str) -> Result<Value> {
    ubus_call(base_url, session, "system", "board", None).await
}

/// Get system info (memory, load, uptime)
pub async fn get_system_info(base_url: &str, session: &str) -> Result<Value> {
    ubus_call(base_url, session, "system", "info", None).await
}

/// Get network interfaces
pub async fn get_network_interfaces(base_url: &str, session: &str) -> Result<Value> {
    ubus_call(base_url, session, "network.interface", "dump", None).await
}

/// Get wireless devices (luci-rpc)
pub async fn get_wireless_devices(base_url: &str, session: &str) -> Result<Value> {
    ubus_call(base_url, session, "luci-rpc", "getWirelessDevices", None).await
}

/// Get UCI config
pub async fn get_uci_config(base_url: &str, session: &str, config: &str) -> Result<Value> {
    ubus_call(base_url, session, "uci", "get", Some(json!({ "config": config }))).await
}

/// Get iwinfo assoclist (connected WiFi clients)
pub async fn get_assoclist(base_url: &str, session: &str, device: &str) -> Result<Value> {
    ubus_call(base_url, session, "iwinfo", "assoclist", Some(json!({ "device": device }))).await
}

/// Reboot device
pub async fn reboot(base_url: &str, session: &str) -> Result<Value> {
    ubus_call(base_url, session, "system", "reboot", None).await
}
