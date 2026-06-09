// Bluegrass Singles Database Connector
const BluegrassDB = {
  async addSingle(data) {
    try {
      const response = await apiPost(CONFIG.googleScriptUrl, data);
      if (response.status === 'success') {
        return { success: true };
      } else {
        throw new Error(response.message || 'Submission failed');
      }
    } catch (error) {
      console.error('Submission error:', error);
      throw error;
    }
  }
};

// Keep the apiPost function we added for debugging
async function apiPost(url, data) {
  try {
    console.log("Sending to:", url);
    console.log("Data being sent:", data);
    
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    
    console.log("Response status:", response.status);
    const text = await response.text();
    console.log("Raw response:", text);
    
    let json;
    try {
      json = JSON.parse(text);
    } catch(e) {
      json = { status: 'error', message: text };
    }
    
    console.log("Parsed response:", json);
    return json;
  } catch (error) {
    console.error("Fetch error:", error);
    throw error;
  }
}