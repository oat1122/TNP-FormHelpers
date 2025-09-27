/**
 * 🧪 API Testing Script for Location Data
 * ใช้สำหรับตรวจสอบการทำงานของ API endpoints
 */

// วิธีใช้งาน: เปิด browser console และ paste โค้ดนี้
const testLocationAPI = async () => {
  const baseUrl = "http://localhost:8000/api/v1";
  const token = localStorage.getItem("authToken") || localStorage.getItem("token");

  const headers = {
    "Content-Type": "application/json",
    Accept: "application/json",
    Authorization: `Bearer ${token}`,
  };

  console.group("🧪 Testing Location API");

  // Test 1: Get Provinces
  try {
    console.log("1️⃣ Testing Provinces API...");
    const provincesResponse = await fetch(`${baseUrl}/locations`, { headers });
    const provincesData = await provincesResponse.json();

    console.log("📊 Provinces Response Status:", provincesResponse.status);
    console.log("📊 Provinces Raw Data:", provincesData);
    console.log("📊 Provinces Array:", provincesData.master_provinces);

    if (provincesData.master_provinces && provincesData.master_provinces.length > 0) {
      const sampleProvince = provincesData.master_provinces[0];
      console.log("📌 Sample Province:", sampleProvince);
      console.log("📌 Province Fields:", Object.keys(sampleProvince));

      // Test 2: Get Districts for first province
      const provinceId = sampleProvince.pro_sort_id || sampleProvince.pro_id;
      if (provinceId) {
        console.log("2️⃣ Testing Districts API with province ID:", provinceId);
        const districtsResponse = await fetch(
          `${baseUrl}/locations?province_sort_id=${provinceId}`,
          { headers }
        );
        const districtsData = await districtsResponse.json();

        console.log("🏘️ Districts Response Status:", districtsResponse.status);
        console.log("🏘️ Districts Raw Data:", districtsData);
        console.log("🏘️ Districts Array:", districtsData.master_district);

        if (districtsData.master_district && districtsData.master_district.length > 0) {
          const sampleDistrict = districtsData.master_district[0];
          console.log("📌 Sample District:", sampleDistrict);
          console.log("📌 District Fields:", Object.keys(sampleDistrict));

          // Test 3: Get Subdistricts for first district
          const districtId = sampleDistrict.dis_sort_id || sampleDistrict.dis_id;
          if (districtId) {
            console.log("3️⃣ Testing Subdistricts API with district ID:", districtId);
            const subdistrictsResponse = await fetch(
              `${baseUrl}/locations?district_sort_id=${districtId}`,
              { headers }
            );
            const subdistrictsData = await subdistrictsResponse.json();

            console.log("🏡 Subdistricts Response Status:", subdistrictsResponse.status);
            console.log("🏡 Subdistricts Raw Data:", subdistrictsData);
            console.log("🏡 Subdistricts Array:", subdistrictsData.master_subdistrict);

            if (
              subdistrictsData.master_subdistrict &&
              subdistrictsData.master_subdistrict.length > 0
            ) {
              const sampleSubdistrict = subdistrictsData.master_subdistrict[0];
              console.log("📌 Sample Subdistrict:", sampleSubdistrict);
              console.log("📌 Subdistrict Fields:", Object.keys(sampleSubdistrict));
            } else {
              console.warn("⚠️ No subdistricts found");
            }
          } else {
            console.warn("⚠️ No valid district ID found");
          }
        } else {
          console.warn("⚠️ No districts found");
        }
      } else {
        console.warn("⚠️ No valid province ID found");
      }
    } else {
      console.warn("⚠️ No provinces found");
    }
  } catch (error) {
    console.error("❌ API Test Error:", error);
  }

  console.groupEnd();
};

// Test Business Types API
const testBusinessTypesAPI = async () => {
  const baseUrl = "http://localhost:8000/api/v1";
  const token = localStorage.getItem("authToken") || localStorage.getItem("token");

  const headers = {
    "Content-Type": "application/json",
    Accept: "application/json",
    Authorization: `Bearer ${token}`,
  };

  console.group("🧪 Testing Business Types API");

  try {
    console.log("Testing Business Types API...");
    const response = await fetch(`${baseUrl}/get-all-business-types`, { headers });
    const data = await response.json();

    console.log("📊 Business Types Response Status:", response.status);
    console.log("📊 Business Types Raw Data:", data);

    if (Array.isArray(data) && data.length > 0) {
      const sample = data[0];
      console.log("📌 Sample Business Type:", sample);
      console.log("📌 Business Type Fields:", Object.keys(sample));
    } else {
      console.warn("⚠️ No business types found");
    }
  } catch (error) {
    console.error("❌ Business Types API Test Error:", error);
  }

  console.groupEnd();
};

// Export for console use
console.log("🚀 API Test Functions Ready!");
console.log("Run: testLocationAPI() - to test location endpoints");
console.log("Run: testBusinessTypesAPI() - to test business types endpoint");

// Auto-run tests
testLocationAPI();
testBusinessTypesAPI();
