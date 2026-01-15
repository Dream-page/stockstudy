/**
 * Check different sheet IDs to find the correct data
 */

const BASE_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTE6rU_HSro410_ho2cm9qlg-zgvNQuakmK_iYzRcCpRmS4ZFCnsM_GvZ4egwhTMWjpLs5zwYJB2SSh/pub';

// Try different common gid values
const gids = [0, 1977864363, 1, 2];

async function checkSheet(gid) {
  try {
    const url = `${BASE_URL}?gid=${gid}&single=true&output=csv`;
    console.log(`\n📊 Checking gid=${gid}...\n`);

    const response = await fetch(url, {
      method: 'GET',
      cache: 'no-cache',
    });

    if (!response.ok) {
      console.log(`❌ Failed: ${response.status}`);
      return;
    }

    const csvText = await response.text();
    const lines = csvText.trim().split('\n');

    console.log(`Lines: ${lines.length}`);
    console.log(`First line: ${lines[0].substring(0, 200)}`);
    if (lines.length > 1) {
      console.log(`Second line: ${lines[1].substring(0, 200)}`);
    }

  } catch (error) {
    console.error(`❌ Error for gid=${gid}:`, error.message);
  }
}

async function checkAllSheets() {
  for (const gid of gids) {
    await checkSheet(gid);
  }
}

checkAllSheets();
