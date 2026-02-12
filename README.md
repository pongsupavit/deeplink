# Deeplink Testing Tool

เครื่องมือทดสอบ Deeplink แบบง่าย ใช้ได้ทั้ง **URI Scheme**, **App Link**, และ **Universal Link**
เหมาะสำหรับแชร์ลิงก์ให้ทีมไว้ลองเปิดบนมือถือได้รวดเร็ว

## ฟีเจอร์หลัก
- ทดสอบลิงก์ Deeplink ได้ทันที
- สร้างลิงก์แชร์สำหรับให้ผู้อื่นเปิดทดสอบ
- Dropdown ประวัติพร้อมคีย์บอร์ดนำทาง
- Desktop จะเปิด Popup QR ให้สแกน
- รองรับ Light/Dark mode

## วิธีใช้งาน
1. ใส่ลิงก์ Deeplink ในช่อง
2. กด `Click to test`
3. Desktop จะแสดง QR Code เพื่อให้มือถือสแกน
4. กด `Copy share URL` เพื่อส่งลิงก์ให้ผู้อื่นทดสอบ
## การรันแบบ Localhost
แนะนำให้เปิดผ่าน server เพื่อให้โหลดเร็วกว่า `file://`

```bash
python3 -m http.server 8000
```

แล้วเปิดเบราว์เซอร์ไปที่:
```
http://localhost:8000
```

## หมายเหตุ
- หากต้องการเปลี่ยนจำนวนประวัติ หรือจำนวนวันเก็บข้อมูล
  สามารถแก้ไขได้ในไฟล์ `app.js`
  - `HISTORY_LIMIT` (จำนวนรายการ)
  - `HISTORY_TTL_MS` (ระยะเวลาเก็บข้อมูล)

## ไฟล์สำคัญ
- `index.html` โครงสร้างหน้าเว็บ
- `styles.css` สไตล์ทั้งหมด
- `app.js` logic ของระบบ
- `qr-lib.js` ตัวโหลดไลบรารี QR (แบบ on-demand)

## Credit
- QR Code library: `qrcodejs` by davidshimjs (MIT License)
