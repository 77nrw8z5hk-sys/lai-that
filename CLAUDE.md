# Agent 7 – Lãi Thật (sổ tay cho phiên đám mây, đọc hết trước khi làm)

## Mục tiêu duy nhất
Tiền thật vào Vietcombank 1016315101 (Dương Trọng Tín) từ bán mã mở khoá Lãi Thật (99.000đ/tháng, 499.000đ trọn đời).
- Mốc 1: ≥ 3.000.000đ trước 30/11/2026. Mốc 2: ≥ 9.000.000đ trong tháng 12/2026.
- Trượt mốc → ghi `SAU-THAT-BAI.md` (vì sao trượt, học được gì, số liệu) và dừng mọi việc khác.
- Doanh thu thật do chủ trang ghi vào `DOANH-THU.md`; agent không tự bịa số.

## Sản phẩm
Web tĩnh GitHub Pages: https://77nrw8z5hk-sys.github.io/lai-that/ (đẩy lên nhánh `main` là tự đăng).
- `index.html` + `app.js`: thả file đơn Shopee/TikTok → lãi ròng theo mã hàng. Bản miễn phí: 5 mã, 31 ngày.
- Mua: VietQR tạo tại chỗ → khách nhắn Zalo 0972699196 → chủ trang cấp mã (`tools/keygen.mjs` chỉ ở máy chủ trang, KHÔNG đưa lên kho).
- Bài SEO: `phi-shopee-2026.html` (mẫu trình bày). Mọi bài mới thêm vào `sitemap.xml` và thêm 1 thẻ `<a href><b>tiêu đề</b><span>1 câu mô tả</span></a>` vào khối `.reads` (mục "Hiểu từng đồng phí") ở `index.html`. Giữ nguyên giao diện trang chủ, không đổi màu/font/bố cục.

## Việc mỗi lần chạy (theo thứ tự)
1. Kiểm trang chủ, `app.js`, mọi bài trong sitemap trả 200 (curl). Hỏng → sửa trước tiên.
2. Viết 1 bài hướng dẫn mới cho người bán Shopee/TikTok Shop VN (phí sàn, tính giá bán, thuế hộ kinh doanh bán online, hàng hoàn, quảng cáo, đối soát tiền về…). Chọn chủ đề người bán thật hay tìm, chưa có bài. Mỗi bài: số liệu cụ thể, công thức, ví dụ tính tay đúng, nút dẫn về công cụ, câu miễn trừ "không phải tư vấn thuế/tài chính". Không bịa số liệu sàn; chưa chắc thì ghi "kiểm tra trong Kênh Người Bán".
3. Mỗi tuần 1 lần (Chủ nhật): cải tiến công cụ hoặc trang chủ để tăng tỉ lệ mua (ví dụ thêm định dạng file, sửa lỗi đọc cột, câu chữ rõ hơn). Thử bằng dữ liệu mẫu trước khi đẩy.
4. Ghi 1 dòng vào `NHAT-KY.md`: ngày · việc đã làm · link bài · số liệu đo được.
5. Commit + push thẳng `main`.

## Cấm
Giao dịch/chuyển tiền; khuyến nghị đầu tư; cam kết lợi nhuận; đánh giá giả, bot tăng lượt, spam; sao chép bài người khác; ghi khoá/mật khẩu vào kho; sửa số tài khoản nhận tiền hay Zalo; hoạt động trái luật dưới mọi hình thức.
