
export class CSVParser {
  /**
   * Parses a CSV file and returns an array of objects.
   * Handles Korean character encodings (UTF-8, EUC-KR/CP949).
   * Improved to handle cases without headers.
   */
  static async parse(file: File): Promise<any[]> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        const arrayBuffer = e.target?.result as ArrayBuffer;
        if (!arrayBuffer) return resolve([]);

        // Try decoding as UTF-8 first
        let text = new TextDecoder("utf-8").decode(arrayBuffer);
        
        // Check for common Korean breakage characters (mojibake)
        // If it looks broken, fallback to EUC-KR
        if (text.includes('')) {
          text = new TextDecoder("euc-kr").decode(arrayBuffer);
        }

        // Split by lines and clean
        const lines = text.split(/\r?\n/).map(l => l.trim()).filter(line => line !== "");
        if (lines.length === 0) return resolve([]);

        const firstLineValues = lines[0].split(',').map(v => v.trim().replace(/^"|"$/g, ''));
        
        // Determine if first line is a header
        // Simple heuristic: check if common keywords are in the first line
        const headerKeywords = ['이름', 'name', '아이디', 'username', '코드', '비밀번호', 'password'];
        const hasHeader = firstLineValues.some(val => headerKeywords.includes(val.toLowerCase()));

        let headers: string[] = [];
        let startIndex = 0;

        if (hasHeader) {
          headers = firstLineValues;
          startIndex = 1;
        } else {
          // No header: assign generic headers based on expected column order
          // For Students: Name, Code
          // For Accounts: Name, ID, Password
          headers = ['col0', 'col1', 'col2', 'col3'];
          startIndex = 0;
        }
        
        // Extract rows
        const data = lines.slice(startIndex).map(line => {
          const values = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
          const obj: any = {};
          
          // Map either by header name or by generic column index
          values.forEach((val, index) => {
            if (hasHeader) {
              obj[headers[index]] = val;
            } else {
              // Also provide semantic keys for convenience in consumers
              obj[`col${index}`] = val;
              // Add aliases for headerless logic
              if (index === 0) obj['이름'] = val;
              if (index === 1) obj['아이디'] = val; // for accounts
              if (index === 1) obj['입장코드'] = val; // for students
              if (index === 2) obj['비밀번호'] = val;
            }
          });
          return obj;
        });

        resolve(data);
      };

      reader.onerror = (err) => reject(err);
      reader.readAsArrayBuffer(file);
    });
  }
}
