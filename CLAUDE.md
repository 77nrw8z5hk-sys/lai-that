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
0a. Nếu kho chưa có `.claude/skills/research`, tải bộ skill chủ trang chọn (đã kiểm an toàn 01/11) vào `.claude/skills/` rồi commit: `curl -sL https://codeload.github.com/mattpocock/skills/tar.gz/HEAD | tar -xz` lấy `skills/productivity/grilling`, `skills/productivity/grill-me`, `skills/engineering/research`; `cloudflare/security-audit-skill` lấy `skills/security-audit`; `cathrynlavery/diagram-design` lấy `skills/diagram-design`. Không tải kho nào khác.
0. Đọc `NGHIEN-CUU.md` (hướng đi, chủ đề ưu tiên). Có skill nào trong phiên hợp việc (SEO, viết nội dung, frontend) thì nạp và dùng, ghi tên skill vào nhật ký.
1. Kiểm trang chủ, `app.js`, mọi bài trong sitemap trả 200 (curl). Hỏng → sửa trước tiên.
2. Viết 1 bài theo danh sách ưu tiên trong `NGHIEN-CUU.md` (hết danh sách thì tự nghiên cứu chủ đề mới bằng WebSearch). Kiểm chứng mọi con số luật/phí bằng WebSearch, ghi nguồn cuối bài. Bài hướng dẫn mới cho người bán Shopee/TikTok Shop VN (phí sàn, tính giá bán, thuế hộ kinh doanh bán online, hàng hoàn, quảng cáo, đối soát tiền về…). Chọn chủ đề người bán thật hay tìm, chưa có bài. Mỗi bài: số liệu cụ thể, công thức, ví dụ tính tay đúng, nút dẫn về công cụ, câu miễn trừ "không phải tư vấn thuế/tài chính". Không bịa số liệu sàn; chưa chắc thì ghi "kiểm tra trong Kênh Người Bán".
3. Mỗi tuần 1 lần (Chủ nhật): cải tiến công cụ hoặc trang chủ để tăng tỉ lệ mua (ví dụ thêm định dạng file, sửa lỗi đọc cột, câu chữ rõ hơn). Thử bằng dữ liệu mẫu trước khi đẩy.
3b. Mỗi Thứ Hai: nghiên cứu lại thị trường (đối thủ, chủ đề người bán đang hỏi, thay đổi phí/thuế), cập nhật `NGHIEN-CUU.md`. Được tự quyết đổi hướng bài, thêm công cụ/trang mới trong kho này nếu số liệu cho thấy hướng cũ không ra đơn.
4. Ghi 1 dòng vào `NHAT-KY.md`: ngày · việc đã làm · link bài · số liệu đo được.
5. Commit + push thẳng `main`.

## Tự sinh dự án
- Mỗi Thứ Hai sau khi nghiên cứu, nếu thấy nhu cầu khác có khả năng ra tiền nhanh hơn (công cụ tính toán, mẫu bảng tính, trang hướng dẫn cho nhóm khách khác…) thì được tự mở dự án mới thành thư mục con trong kho (`/<ten-du-an>/index.html`, tự lên GitHub Pages), thu tiền cùng cách: VietQR Vietcombank 1016315101 + Zalo 0972699196.
- Ghi mỗi dự án vào `DU-AN.md`: tên, ngày mở, giả thuyết, số đo, trạng thái. Dự án 14 ngày không có dấu hiệu (lượt dùng, tin nhắn, tiền) thì đóng, dồn sức cho cái khác.
- Không báo cáo dài; chỉ khi tổng kết mới ghi `SAU-THAT-BAI.md` (hoặc `KET-QUA.md` nếu đạt) ngắn gọn: số tiền, đã thử gì, học được gì.

## Cấm
Giao dịch/chuyển tiền; khuyến nghị đầu tư; cam kết lợi nhuận; đánh giá giả, bot tăng lượt, spam; sao chép bài người khác; ghi khoá/mật khẩu vào kho; sửa số tài khoản nhận tiền hay Zalo; hoạt động trái luật dưới mọi hình thức.
