function Create-KisiKisiDocx {
    param(
        [string]$FilePath,
        [string]$MataPelajaran,
        [string]$Penyusun,
        [array]$Data
    )

    $word = New-Object -ComObject Word.Application
    $word.Visible = $false
    $doc = $word.Documents.Add()
    $selection = $word.Selection

    # Page setup - landscape
    $doc.PageSetup.Orientation = 1  # wdOrientLandscape
    $doc.PageSetup.TopMargin = $word.CentimetersToPoints(1.5)
    $doc.PageSetup.BottomMargin = $word.CentimetersToPoints(1.5)
    $doc.PageSetup.LeftMargin = $word.CentimetersToPoints(1.5)
    $doc.PageSetup.RightMargin = $word.CentimetersToPoints(1.5)

    # HEADER
    $selection.ParagraphFormat.Alignment = 1  # wdAlignParagraphCenter
    $selection.Font.Name = "Times New Roman"
    $selection.Font.Size = 14
    $selection.Font.Bold = $true
    $selection.TypeText("KISI-KISI PENULISAN SOAL")
    $selection.TypeParagraph()

    $selection.Font.Size = 12
    $selection.TypeText("ASAT")
    $selection.TypeParagraph()

    $selection.Font.Size = 11
    $selection.Font.Bold = $false
    $selection.TypeText("Tahun Ajaran 2025 / 2026")
    $selection.TypeParagraph()
    $selection.TypeParagraph()

    # INFO SECTION
    $selection.ParagraphFormat.Alignment = 0  # wdAlignParagraphLeft
    $selection.Font.Size = 11
    $selection.Font.Bold = $false

    $info = @(
        "Jenis Sekolah        : Sekolah Dasar",
        "Alokasi Waktu        : 90 Menit",
        "Mata Pelajaran       : $MataPelajaran",
        "Jumlah Soal          : 40 Soal (30 PG + 5 Isian + 5 Uraian)",
        "Kurikulum Acuan      : Kurikulum Merdeka",
        "Penyusun             : $Penyusun",
        "Kelas / Semester     : IV / Genap",
        "Tahun Pelajaran      : 2025 / 2026"
    )

    foreach ($line in $info) {
        $selection.TypeText($line)
        $selection.TypeParagraph()
    }
    $selection.TypeParagraph()

    # TABLE
    $rows = $Data.Count + 1  # +1 for header
    $cols = 7

    $table = $doc.Tables.Add($selection.Range, $rows, $cols)
    # Apply borders manually
    $table.Borders.InsideLineStyle = 1
    $table.Borders.OutsideLineStyle = 1

    # Set column widths
    $table.Columns.Item(1).Width = 30
    $table.Columns.Item(2).Width = 120
    $table.Columns.Item(3).Width = 35
    $table.Columns.Item(4).Width = 130
    $table.Columns.Item(5).Width = 180
    $table.Columns.Item(6).Width = 40
    $table.Columns.Item(7).Width = 30

    # TABLE HEADER
    $headers = @("No.", "Capaian Pembelajaran", "Kelas/SMT", "Uraian Materi", "Indikator Soal", "Bentuk Soal", "Nomor Soal")
    for ($c = 0; $c -lt $cols; $c++) {
        $cell = $table.Cell(1, $c + 1)
        $cell.Range.Font.Name = "Times New Roman"
        $cell.Range.Font.Size = 9
        $cell.Range.Font.Bold = $true
        $cell.Range.ParagraphFormat.Alignment = 1
        $cell.Shading.BackgroundPatternColor = -603923969  # Light gray
        $cell.Range.Text = $headers[$c]
    }

    # DATA ROWS
    for ($r = 0; $r -lt $Data.Count; $r++) {
        $row = $Data[$r]
        for ($c = 0; $c -lt $cols; $c++) {
            $cell = $table.Cell($r + 2, $c + 1)
            $cell.Range.Font.Name = "Times New Roman"
            $cell.Range.Font.Size = 8
            $cell.Range.ParagraphFormat.Alignment = 1
            if ($c -eq 1 -or $c -eq 3 -or $c -eq 4) {
                $cell.Range.ParagraphFormat.Alignment = 0  # Left align
            }
            $val = if ($row[$c]) { $row[$c] } else { "" }
            $cell.Range.Text = $val
        }
    }

    # Save and close
    $doc.SaveAs([ref]$FilePath, [ref]16)
    $doc.Close()
    $word.Quit()
    [System.Runtime.Interopservices.Marshal]::ReleaseComObject($word) | Out-Null
    Write-Output "Created: $FilePath"
}

# ========================
# 1. PENDIDIKAN PANCASILA
# ========================
$ppkn = @(
    # Unit 3: Keragaman Budaya Bangsaku (soal 1-20)
    @("1", "Peserta didik mampu mengidentifikasi dan menghargai keragaman budaya, suku, agama, dan golongan di Indonesia", "IV/Genap", "Pengertian Keragaman Budaya", "Murid mampu menjelaskan pengertian keragaman budaya dengan benar", "PG", "1"),
    @("2", "Peserta didik mampu mengidentifikasi dan menghargai keragaman budaya, suku, agama, dan golongan di Indonesia", "IV/Genap", "Macam-macam Suku Bangsa di Indonesia", "Murid mampu menyebutkan contoh suku bangsa yang ada di Indonesia", "PG", "2"),
    @("3", "Peserta didik mampu mengidentifikasi dan menghargai keragaman budaya, suku, agama, dan golongan di Indonesia", "IV/Genap", "Bahasa Daerah di Indonesia", "Murid mampu mengidentifikasi bahasa daerah dari berbagai provinsi di Indonesia", "PG", "3"),
    @("4", "Peserta didik mampu mengidentifikasi dan menghargai keragaman budaya, suku, agama, dan golongan di Indonesia", "IV/Genap", "Rumah Adat di Indonesia", "Murid mampu mengidentifikasi rumah adat dari berbagai daerah di Indonesia", "PG", "4"),
    @("5", "Peserta didik mampu mengidentifikasi dan menghargai keragaman budaya, suku, agama, dan golongan di Indonesia", "IV/Genap", "Pakaian Adat di Indonesia", "Murid mampu mengidentifikasi pakaian adat dari berbagai daerah di Indonesia", "PG", "5"),
    @("6", "Peserta didik mampu mengidentifikasi dan menghargai keragaman budaya, suku, agama, dan golongan di Indonesia", "IV/Genap", "Makanan Khas Daerah", "Murid mampu menyebutkan makanan khas dari berbagai daerah di Indonesia", "PG", "6"),
    @("7", "Peserta didik mampu mengidentifikasi dan menghargai keragaman budaya, suku, agama, dan golongan di Indonesia", "IV/Genap", "Tarian Daerah di Indonesia", "Murid mampu mengidentifikasi tarian tradisional dari berbagai daerah", "PG", "7"),
    @("8", "Peserta didik mampu mengidentifikasi dan menghargai keragaman budaya, suku, agama, dan golongan di Indonesia", "IV/Genap", "Alat Musik Tradisional", "Murid mampu mengidentifikasi alat musik tradisional dari berbagai daerah", "PG", "8"),
    @("9", "Peserta didik mampu mengidentifikasi dan menghargai keragaman budaya, suku, agama, dan golongan di Indonesia", "IV/Genap", "Sikap Toleransi dalam Keragaman", "Murid mampu menjelaskan pentingnya sikap toleransi dalam kehidupan sehari-hari", "PG", "9"),
    @("10", "Peserta didik mampu mengidentifikasi dan menghargai keragaman budaya, suku, agama, dan golongan di Indonesia", "IV/Genap", "Gotong Royong", "Murid mampu mengidentifikasi contoh kegiatan gotong royong di lingkungan sekitar", "PG", "10"),
    @("11", "Peserta didik mampu mengidentifikasi dan menghargai keragaman budaya, suku, agama, dan golongan di Indonesia", "IV/Genap", "Manfaat Keragaman Budaya", "Murid mampu menganalisis manfaat dari keragaman budaya bangsa Indonesia", "PG", "11"),
    @("12", "Peserta didik mampu mengidentifikasi dan menghargai keragaman budaya, suku, agama, dan golongan di Indonesia", "IV/Genap", "Bhinneka Tunggal Ika", "Murid mampu menjelaskan makna semboyan Bhinneka Tunggal Ika", "PG", "12"),
    @("13", "Peserta didik mampu mengidentifikasi dan menghargai keragaman budaya, suku, agama, dan golongan di Indonesia", "IV/Genap", "Sikap Menghargai Teman Berbeda Agama", "Murid mampu mengidentifikasi sikap yang tepat terhadap teman yang berbeda agama", "PG", "13"),
    @("14", "Peserta didik mampu mengidentifikasi dan menghargai keragaman budaya, suku, agama, dan golongan di Indonesia", "IV/Genap", "Keragaman Golongan di Indonesia", "Murid mampu mengidentifikasi contoh keragaman golongan di lingkungan sekolah", "PG", "14"),
    @("15", "Peserta didik mampu mengidentifikasi dan menghargai keragaman budaya, suku, agama, dan golongan di Indonesia", "IV/Genap", "Menjaga Persatuan dalam Keragaman", "Murid mampu menjelaskan cara menjaga persatuan dalam keragaman", "PG", "15"),
    @("16", "Peserta didik mampu mengidentifikasi dan menghargai keragaman budaya, suku, agama, dan golongan di Indonesia", "IV/Genap", "Upacara Adat di Indonesia", "Murid mampu mengidentifikasi contoh upacara adat dari berbagai daerah", "PG", "16"),
    @("17", "Peserta didik mampu mengidentifikasi dan menghargai keragaman budaya, suku, agama, dan golongan di Indonesia", "IV/Genap", "Sikap Bangga Terhadap Budaya Sendiri", "Murid mampu mengidentifikasi contoh sikap bangga terhadap budaya sendiri", "PG", "17"),
    @("18", "Peserta didik mampu mengidentifikasi dan menghargai keragaman budaya, suku, agama, dan golongan di Indonesia", "IV/Genap", "Kerja Sama dalam Keberagaman", "Murid mampu mengidentifikasi contoh kerja sama dalam keberagaman di sekolah", "PG", "18"),
    @("19", "Peserta didik mampu mengidentifikasi dan menghargai keragaman budaya, suku, agama, dan golongan di Indonesia", "IV/Genap", "Menolak Diskriminasi", "Murid mampu menjelaskan alasan menolak sikap diskriminasi dalam kehidupan", "PG", "19"),
    @("20", "Peserta didik mampu mengidentifikasi dan menghargai keragaman budaya, suku, agama, dan golongan di Indonesia", "IV/Genap", "Budaya Asing dan Budaya Nasional", "Murid mampu mengidentifikasi perbedaan budaya asing dan budaya nasional", "PG", "20"),

    # Unit 4: Negaraku Indonesia (soal 21-40)
    @("21", "Peserta didik mampu memahami identitas dan karakteristik Negara Kesatuan Republik Indonesia", "IV/Genap", "NKRI (Negara Kesatuan Republik Indonesia)", "Murid mampu menjelaskan pengertian NKRI dengan benar", "PG", "21"),
    @("22", "Peserta didik mampu memahami identitas dan karakteristik Negara Kesatuan Republik Indonesia", "IV/Genap", "Letak Geografis Indonesia", "Murid mampu mengidentifikasi letak geografis Indonesia", "PG", "22"),
    @("23", "Peserta didik mampu memahami identitas dan karakteristik Negara Kesatuan Republik Indonesia", "IV/Genap", "Batas Wilayah Indonesia", "Murid mampu mengidentifikasi batas-batas wilayah Indonesia", "PG", "23"),
    @("24", "Peserta didik mampu memahami identitas dan karakteristik Negara Kesatuan Republik Indonesia", "IV/Genap", "Bendera Merah Putih", "Murid mampu menjelaskan sejarah dan makna Bendera Merah Putih", "PG", "24"),
    @("25", "Peserta didik mampu memahami identitas dan karakteristik Negara Kesatuan Republik Indonesia", "IV/Genap", "Bahasa Indonesia sebagai Bahasa Persatuan", "Murid mampu menjelaskan fungsi bahasa Indonesia sebagai bahasa persatuan", "PG", "25"),
    @("26", "Peserta didik mampu memahami identitas dan karakteristik Negara Kesatuan Republik Indonesia", "IV/Genap", "Lambang Negara Garuda Pancasila", "Murid mampu menjelaskan makna lambang Garuda Pancasila", "PG", "26"),
    @("27", "Peserta didik mampu memahami identitas dan karakteristik Negara Kesatuan Republik Indonesia", "IV/Genap", "Makna Sila-sila Pancasila", "Murid mampu mengidentifikasi lambang dan makna setiap sila Pancasila", "PG", "27"),
    @("28", "Peserta didik mampu memahami identitas dan karakteristik Negara Kesatuan Republik Indonesia", "IV/Genap", "Lagu Kebangsaan Indonesia Raya", "Murid mampu menjelaskan sejarah dan makna lagu Indonesia Raya", "PG", "28"),
    @("29", "Peserta didik mampu memahami identitas dan karakteristik Negara Kesatuan Republik Indonesia", "IV/Genap", "Tokoh Perumus Pancasila", "Murid mampu mengidentifikasi tokoh-tokoh perumus Pancasila", "PG", "29"),
    @("30", "Peserta didik mampu memahami identitas dan karakteristik Negara Kesatuan Republik Indonesia", "IV/Genap", "Hak dan Kewajiban Warga Negara", "Murid mampu mengidentifikasi hak dan kewajiban sebagai warga negara", "PG", "30"),
    @("31", "Peserta didik mampu memahami identitas dan karakteristik Negara Kesatuan Republik Indonesia", "IV/Genap", "Penerapan Sila Pertama Pancasila", "Murid mampu menganalisis penerapan sila pertama Pancasila dalam kehidupan sehari-hari", "Isian", "31"),
    @("32", "Peserta didik mampu memahami identitas dan karakteristik Negara Kesatuan Republik Indonesia", "IV/Genap", "Penerapan Sila Kedua Pancasila", "Murid mampu menganalisis penerapan sila kedua Pancasila dalam kehidupan sehari-hari", "Isian", "32"),
    @("33", "Peserta didik mampu memahami identitas dan karakteristik Negara Kesatuan Republik Indonesia", "IV/Genap", "Penerapan Sila Ketiga Pancasila", "Murid mampu menganalisis penerapan sila ketiga Pancasila dalam kehidupan sehari-hari", "Isian", "33"),
    @("34", "Peserta didik mampu memahami identitas dan karakteristik Negara Kesatuan Republik Indonesia", "IV/Genap", "Penerapan Sila Keempat Pancasila", "Murid mampu menganalisis penerapan sila keempat Pancasila dalam kehidupan sehari-hari", "Isian", "34"),
    @("35", "Peserta didik mampu memahami identitas dan karakteristik Negara Kesatuan Republik Indonesia", "IV/Genap", "Penerapan Sila Kelima Pancasila", "Murid mampu menganalisis penerapan sila kelima Pancasila dalam kehidupan sehari-hari", "Isian", "35"),
    @("36", "Peserta didik mampu memahami identitas dan karakteristik Negara Kesatuan Republik Indonesia", "IV/Genap", "Sikap Cinta Tanah Air", "Murid mampu mengidentifikasi contoh sikap cinta tanah air", "Uraian", "36"),
    @("37", "Peserta didik mampu memahami identitas dan karakteristik Negara Kesatuan Republik Indonesia", "IV/Genap", "Sikap Mempertahankan NKRI", "Murid mampu menjelaskan cara mempertahankan keutuhan NKRI", "Uraian", "37"),
    @("38", "Peserta didik mampu memahami identitas dan karakteristik Negara Kesatuan Republik Indonesia", "IV/Genap", "Keberagaman sebagai Kekuatan Bangsa", "Murid mampu menganalisis bagaimana keberagaman menjadi kekuatan bangsa Indonesia", "Uraian", "38"),
    @("39", "Peserta didik mampu memahami identitas dan karakteristik Negara Kesatuan Republik Indonesia", "IV/Genap", "Kewajiban di Rumah dan Sekolah", "Murid mampu mengidentifikasi kewajiban di rumah dan di sekolah", "Uraian", "39"),
    @("40", "Peserta didik mampu memahami identitas dan karakteristik Negara Kesatuan Republik Indonesia", "IV/Genap", "Musyawarah sebagai Bentuk Demokrasi", "Murid mampu menjelaskan pentingnya musyawarah dalam pengambilan keputusan", "Uraian", "40")
)

Create-KisiKisiDocx -FilePath "D:\CodinganDong\myidea\projects\sibete\kisikisi\sd4\Kisi-kisi ASAT PPKn Kelas 4 smtr 2_25-26.docx" -MataPelajaran "Pendidikan Pancasila" -Penyusun "Tim Guru PPKn" -Data $ppkn
Write-Output "PPKn done."

# ========================
# 2. BAHASA INDONESIA
# ========================
$bind = @(
    # Bab 5: Bertukar atau Membayar (soal 1-10)
    @("1", "Peserta didik mampu memahami dan menyajikan teks prosedur serta kalimat efektif", "IV/Genap", "Pengertian Teks Prosedur", "Murid mampu menjelaskan pengertian teks prosedur dengan benar", "PG", "1"),
    @("2", "Peserta didik mampu memahami dan menyajikan teks prosedur serta kalimat efektif", "IV/Genap", "Ciri-ciri Teks Prosedur", "Murid mampu mengidentifikasi ciri-ciri teks prosedur", "PG", "2"),
    @("3", "Peserta didik mampu memahami dan menyajikan teks prosedur serta kalimat efektif", "IV/Genap", "Struktur Teks Prosedur", "Murid mampu mengidentifikasi struktur teks prosedur", "PG", "3"),
    @("4", "Peserta didik mampu memahami dan menyajikan teks prosedur serta kalimat efektif", "IV/Genap", "Kata Berimbuhan ter-", "Murid mampu mengidentifikasi kata berimbuhan ter- dalam kalimat", "PG", "4"),
    @("5", "Peserta didik mampu memahami dan menyajikan teks prosedur serta kalimat efektif", "IV/Genap", "Kalimat Efektif", "Murid mampu mengidentifikasi kalimat efektif dalam teks", "PG", "5"),
    @("6", "Peserta didik mampu memahami dan menyajikan teks prosedur serta kalimat efektif", "IV/Genap", "Kalimat Saran", "Murid mampu menyusun kalimat saran yang tepat", "PG", "6"),
    @("7", "Peserta didik mampu memahami dan menyajikan teks prosedur serta kalimat efektif", "IV/Genap", "Kata Kunci dalam Teks Prosedur", "Murid mampu mengidentifikasi kata kunci dalam teks prosedur", "PG", "7"),
    @("8", "Peserta didik mampu memahami dan menyajikan teks prosedur serta kalimat efektif", "IV/Genap", "Menyusun Teks Prosedur Sederhana", "Murid mampu mengurutkan langkah-langkah teks prosedur", "PG", "8"),
    @("9", "Peserta didik mampu memahami dan menyajikan teks prosedur serta kalimat efektif", "IV/Genap", "Penggunaan Kata Penghubung dalam Teks Prosedur", "Murid mampu mengidentifikasi kata penghubung dalam teks prosedur", "PG", "9"),
    @("10", "Peserta didik mampu memahami dan menyajikan teks prosedur serta kalimat efektif", "IV/Genap", "Menyunting Teks Prosedur", "Murid mampu menyunting kesalahan dalam teks prosedur", "PG", "10"),

    # Bab 6: Satu Titik (soal 11-18)
    @("11", "Peserta didik mampu memahami dan mengapresiasi teks fiksi", "IV/Genap", "Pengertian Teks Fiksi", "Murid mampu menjelaskan pengertian teks fiksi", "PG", "11"),
    @("12", "Peserta didik mampu memahami dan mengapresiasi teks fiksi", "IV/Genap", "Unsur Intrinsik Cerita", "Murid mampu mengidentifikasi unsur intrinsik dalam cerita fiksi", "PG", "12"),
    @("13", "Peserta didik mampu memahami dan mengapresiasi teks fiksi", "IV/Genap", "Tokoh dan Penokohan", "Murid mampu mengidentifikasi tokoh dan watak tokoh dalam cerita", "PG", "13"),
    @("14", "Peserta didik mampu memahami dan mengapresiasi teks fiksi", "IV/Genap", "Latar (Setting) Cerita", "Murid mampu mengidentifikasi latar tempat, waktu, dan suasana dalam cerita", "PG", "14"),
    @("15", "Peserta didik mampu memahami dan mengapresiasi teks fiksi", "IV/Genap", "Alur (Plot) Cerita", "Murid mampu mengidentifikasi alur cerita dalam teks fiksi", "PG", "15"),
    @("16", "Peserta didik mampu memahami dan mengapresiasi teks fiksi", "IV/Genap", "Amanat dalam Cerita", "Murid mampu menentukan amanat yang terkandung dalam cerita", "PG", "16"),
    @("17", "Peserta didik mampu memahami dan mengapresiasi teks fiksi", "IV/Genap", "Sudut Pandang Cerita", "Murid mampu mengidentifikasi sudut pandang dalam cerita fiksi", "PG", "17"),
    @("18", "Peserta didik mampu memahami dan mengapresiasi teks fiksi", "IV/Genap", "Menceritakan Kembali Isi Cerita", "Murid mampu menceritakan kembali isi cerita fiksi dengan bahasa sendiri", "PG", "18"),

    # Bab 7: Asal Usul (soal 19-30)
    @("19", "Peserta didik mampu memahami dan menyajikan teks eksplanasi", "IV/Genap", "Pengertian Teks Eksplanasi", "Murid mampu menjelaskan pengertian teks eksplanasi", "PG", "19"),
    @("20", "Peserta didik mampu memahami dan menyajikan teks eksplanasi", "IV/Genap", "Ciri-ciri Teks Eksplanasi", "Murid mampu mengidentifikasi ciri-ciri teks eksplanasi", "PG", "20"),
    @("21", "Peserta didik mampu memahami dan menyajikan teks eksplanasi", "IV/Genap", "Struktur Teks Eksplanasi", "Murid mampu mengidentifikasi struktur teks eksplanasi", "PG", "21"),
    @("22", "Peserta didik mampu memahami dan menyajikan teks eksplanasi", "IV/Genap", "Ide Pokok Paragraf", "Murid mampu menentukan ide pokok paragraf dalam teks eksplanasi", "PG", "22"),
    @("23", "Peserta didik mampu memahami dan menyajikan teks eksplanasi", "IV/Genap", "Informasi Penting dalam Teks", "Murid mampu mengidentifikasi informasi penting dalam teks eksplanasi", "PG", "23"),
    @("24", "Peserta didik mampu memahami dan menyajikan teks eksplanasi", "IV/Genap", "Kata Baku dan Tidak Baku", "Murid mampu mengidentifikasi kata baku dan tidak baku dalam teks", "PG", "24"),
    @("25", "Peserta didik mampu memahami dan menyajikan teks eksplanasi", "IV/Genap", "Kata Tanya Apa, Mengapa, Bagaimana", "Murid mampu menggunakan kata tanya apa, mengapa, dan bagaimana dengan tepat", "PG", "25"),
    @("26", "Peserta didik mampu memahami dan menyajikan teks eksplanasi", "IV/Genap", "Hubungan Sebab Akibat", "Murid mampu mengidentifikasi hubungan sebab akibat dalam teks eksplanasi", "PG", "26"),
    @("27", "Peserta didik mampu memahami dan menyajikan teks eksplanasi", "IV/Genap", "Ringkasan Teks Eksplanasi", "Murid mampu meringkas teks eksplanasi dengan tepat", "PG", "27"),
    @("28", "Peserta didik mampu memahami dan menyajikan teks eksplanasi", "IV/Genap", "Kalimat Utama dan Kalimat Penjelas", "Murid mampu mengidentifikasi kalimat utama dan kalimat penjelas", "PG", "28"),
    @("29", "Peserta didik mampu memahami dan menyajikan teks eksplanasi", "IV/Genap", "Kosakata Baru dalam Teks", "Murid mampu mengartikan kosakata baru dalam teks eksplanasi", "PG", "29"),
    @("30", "Peserta didik mampu memahami dan menyajikan teks eksplanasi", "IV/Genap", "Menyusun Teks Eksplanasi Sederhana", "Murid mampu menyusun teks eksplanasi sederhana tentang suatu fenomena", "PG", "30"),

    # Bab 8: Sehatlah Ragaku (soal 31-40)
    @("31", "Peserta didik mampu memahami teks petunjuk dan poster", "IV/Genap", "Pengertian Teks Petunjuk", "Murid mampu menjelaskan pengertian teks petunjuk", "Isian", "31"),
    @("32", "Peserta didik mampu memahami teks petunjuk dan poster", "IV/Genap", "Ciri-ciri Teks Petunjuk", "Murid mampu mengidentifikasi ciri-ciri teks petunjuk", "Isian", "32"),
    @("33", "Peserta didik mampu memahami teks petunjuk dan poster", "IV/Genap", "Kalimat Perintah dalam Teks Petunjuk", "Murid mampu mengidentifikasi kalimat perintah dalam teks petunjuk", "Isian", "33"),
    @("34", "Peserta didik mampu memahami teks petunjuk dan poster", "IV/Genap", "Pengertian Poster", "Murid mampu menjelaskan pengertian poster", "Isian", "34"),
    @("35", "Peserta didik mampu memahami teks petunjuk dan poster", "IV/Genap", "Ciri-ciri Poster yang Baik", "Murid mampu mengidentifikasi ciri-ciri poster yang baik", "Isian", "35"),
    @("36", "Peserta didik mampu memahami teks petunjuk dan poster", "IV/Genap", "Menyusun Teks Petunjuk Sederhana", "Murid mampu menyusun teks petunjuk melakukan sesuatu", "Uraian", "36"),
    @("37", "Peserta didik mampu memahami teks petunjuk dan poster", "IV/Genap", "Membuat Poster Sederhana", "Murid mampu membuat poster sederhana dengan pesan yang jelas", "Uraian", "37"),
    @("38", "Peserta didik mampu memahami teks petunjuk dan poster", "IV/Genap", "Menyunting Kalimat dalam Teks Petunjuk", "Murid mampu menyunting kalimat yang tidak efektif dalam teks petunjuk", "Uraian", "38"),
    @("39", "Peserta didik mampu memahami teks petunjuk dan poster", "IV/Genap", "Menganalisis Pesan Poster", "Murid mampu menganalisis pesan yang terkandung dalam poster", "Uraian", "39"),
    @("40", "Peserta didik mampu memahami teks petunjuk dan poster", "IV/Genap", "Perbedaan Teks Petunjuk dan Poster", "Murid mampu mengidentifikasi perbedaan teks petunjuk dan poster", "Uraian", "40")
)

Create-KisiKisiDocx -FilePath "D:\CodinganDong\myidea\projects\sibete\kisikisi\sd4\Kisi-kisi ASAT Bahasa Indonesia Kelas 4 smtr 2_25-26.docx" -MataPelajaran "Bahasa Indonesia" -Penyusun "Tim Guru Bahasa Indonesia" -Data $bind
Write-Output "Bahasa Indonesia done."

# ========================
# 3. MATEMATIKA
# ========================
$mtk = @(
    # Bab 4: Pengukuran Luas dan Volume (soal 1-14)
    @("1", "Peserta didik mampu memahami konsep luas dan volume bangun ruang sederhana", "IV/Genap", "Pengertian Luas", "Murid mampu menjelaskan pengertian luas suatu bangun datar", "PG", "1"),
    @("2", "Peserta didik mampu memahami konsep luas dan volume bangun ruang sederhana", "IV/Genap", "Satuan Luas", "Murid mampu mengidentifikasi satuan luas yang baku", "PG", "2"),
    @("3", "Peserta didik mampu memahami konsep luas dan volume bangun ruang sederhana", "IV/Genap", "Rumus Luas Persegi", "Murid mampu menghitung luas persegi menggunakan rumus", "PG", "3"),
    @("4", "Peserta didik mampu memahami konsep luas dan volume bangun ruang sederhana", "IV/Genap", "Rumus Luas Persegi Panjang", "Murid mampu menghitung luas persegi panjang menggunakan rumus", "PG", "4"),
    @("5", "Peserta didik mampu memahami konsep luas dan volume bangun ruang sederhana", "IV/Genap", "Rumus Luas Segitiga", "Murid mampu menghitung luas segitiga menggunakan rumus", "PG", "5"),
    @("6", "Peserta didik mampu memahami konsep luas dan volume bangun ruang sederhana", "IV/Genap", "Soal Cerita Luas Bangun Datar", "Murid mampu menyelesaikan soal cerita yang berkaitan dengan luas bangun datar", "PG", "6"),
    @("7", "Peserta didik mampu memahami konsep luas dan volume bangun ruang sederhana", "IV/Genap", "Pengertian Volume", "Murid mampu menjelaskan pengertian volume bangun ruang", "PG", "7"),
    @("8", "Peserta didik mampu memahami konsep luas dan volume bangun ruang sederhana", "IV/Genap", "Satuan Volume", "Murid mampu mengidentifikasi satuan volume yang baku", "PG", "8"),
    @("9", "Peserta didik mampu memahami konsep luas dan volume bangun ruang sederhana", "IV/Genap", "Rumus Volume Kubus", "Murid mampu menghitung volume kubus menggunakan rumus", "PG", "9"),
    @("10", "Peserta didik mampu memahami konsep luas dan volume bangun ruang sederhana", "IV/Genap", "Rumus Volume Balok", "Murid mampu menghitung volume balok menggunakan rumus", "PG", "10"),

    # Bab 5: Bangun Datar (soal 11-25)
    @("11", "Peserta didik mampu memahami sifat-sifat bangun datar", "IV/Genap", "Sifat-sifat Persegi", "Murid mampu mengidentifikasi sifat-sifat bangun persegi", "PG", "11"),
    @("12", "Peserta didik mampu memahami sifat-sifat bangun datar", "IV/Genap", "Sifat-sifat Persegi Panjang", "Murid mampu mengidentifikasi sifat-sifat bangun persegi panjang", "PG", "12"),
    @("13", "Peserta didik mampu memahami sifat-sifat bangun datar", "IV/Genap", "Sifat-sifat Segitiga", "Murid mampu mengidentifikasi sifat-sifat bangun segitiga", "PG", "13"),
    @("14", "Peserta didik mampu memahami sifat-sifat bangun datar", "IV/Genap", "Sifat-sifat Lingkaran", "Murid mampu mengidentifikasi sifat-sifat bangun lingkaran", "PG", "14"),
    @("15", "Peserta didik mampu memahami sifat-sifat bangun datar", "IV/Genap", "Sifat-sifat Trapesium", "Murid mampu mengidentifikasi sifat-sifat bangun trapesium", "PG", "15"),
    @("16", "Peserta didik mampu memahami sifat-sifat bangun datar", "IV/Genap", "Sifat-sifat Jajar Genjang", "Murid mampu mengidentifikasi sifat-sifat bangun jajar genjang", "PG", "16"),
    @("17", "Peserta didik mampu memahami sifat-sifat bangun datar", "IV/Genap", "Sifat-sifat Belah Ketupat", "Murid mampu mengidentifikasi sifat-sifat bangun belah ketupat", "PG", "17"),
    @("18", "Peserta didik mampu memahami sifat-sifat bangun datar", "IV/Genap", "Sifat-sifat Layang-layang", "Murid mampu mengidentifikasi sifat-sifat bangun layang-layang", "PG", "18"),
    @("19", "Peserta didik mampu memahami sifat-sifat bangun datar", "IV/Genap", "Keliling Bangun Datar", "Murid mampu menghitung keliling bangun datar sederhana", "PG", "19"),
    @("20", "Peserta didik mampu memahami sifat-sifat bangun datar", "IV/Genap", "Soal Cerita Bangun Datar", "Murid mampu menyelesaikan soal cerita tentang bangun datar", "PG", "20"),

    # Bab 6: Data dan Diagram (soal 21-30)
    @("21", "Peserta didik mampu menyajikan dan menginterpretasi data dalam bentuk diagram", "IV/Genap", "Pengumpulan Data", "Murid mampu menjelaskan cara mengumpulkan data sederhana", "PG", "21"),
    @("22", "Peserta didik mampu menyajikan dan menginterpretasi data dalam bentuk diagram", "IV/Genap", "Menyajikan Data dalam Tabel", "Murid mampu menyajikan data dalam bentuk tabel", "PG", "22"),
    @("23", "Peserta didik mampu menyajikan dan menginterpretasi data dalam bentuk diagram", "IV/Genap", "Diagram Batang", "Murid mampu membaca data dari diagram batang", "PG", "23"),
    @("24", "Peserta didik mampu menyajikan dan menginterpretasi data dalam bentuk diagram", "IV/Genap", "Membaca Diagram Batang", "Murid mampu menginterpretasi informasi dari diagram batang", "PG", "24"),
    @("25", "Peserta didik mampu menyajikan dan menginterpretasi data dalam bentuk diagram", "IV/Genap", "Modus (Nilai yang Sering Muncul)", "Murid mampu menentukan modus dari sekumpulan data", "PG", "25"),
    @("26", "Peserta didik mampu menyajikan dan menginterpretasi data dalam bentuk diagram", "IV/Genap", "Membandingkan Data dalam Diagram", "Murid mampu membandingkan data yang disajikan dalam diagram", "PG", "26"),
    @("27", "Peserta didik mampu menyajikan dan menginterpretasi data dalam bentuk diagram", "IV/Genap", "Menyimpulkan Data dari Diagram", "Murid mampu menyimpulkan data yang disajikan dalam diagram batang", "PG", "27"),
    @("28", "Peserta didik mampu menyajikan dan menginterpretasi data dalam bentuk diagram", "IV/Genap", "Menyajikan Data dalam Diagram Batang", "Murid mampu menyajikan data sederhana dalam bentuk diagram batang", "PG", "28"),
    @("29", "Peserta didik mampu menyajikan dan menginterpretasi data dalam bentuk diagram", "IV/Genap", "Diagram Gambar (Piktogram)", "Murid mampu membaca dan menyajikan data dalam bentuk piktogram", "PG", "29"),
    @("30", "Peserta didik mampu menyajikan dan menginterpretasi data dalam bentuk diagram", "IV/Genap", "Soal Cerita Data dan Diagram", "Murid mampu menyelesaikan soal cerita yang berkaitan dengan diagram", "PG", "30"),

    # Soal Isian dan Uraian (31-40)
    @("31", "Peserta didik mampu memahami konsep luas dan volume bangun ruang sederhana", "IV/Genap", "Menghitung Luas Gabungan Bangun Datar", "Murid mampu menghitung luas gabungan dua bangun datar", "Isian", "31"),
    @("32", "Peserta didik mampu memahami konsep luas dan volume bangun ruang sederhana", "IV/Genap", "Konversi Satuan Luas", "Murid mampu mengonversi satuan luas sederhana", "Isian", "32"),
    @("33", "Peserta didik mampu memahami konsep luas dan volume bangun ruang sederhana", "IV/Genap", "Menghitung Volume Kubus Satuan", "Murid mampu menghitung volume kubus menggunakan kubus satuan", "Isian", "33"),
    @("34", "Peserta didik mampu memahami konsep luas dan volume bangun ruang sederhana", "IV/Genap", "Menentukan Akar dari Data", "Murid mampu menentukan nilai tertinggi dan terendah dari data", "Isian", "34"),
    @("35", "Peserta didik mampu memahami konsep luas dan volume bangun ruang sederhana", "IV/Genap", "Mengurutkan Data", "Murid mampu mengurutkan data dari nilai terkecil ke terbesar", "Isian", "35"),
    @("36", "Peserta didik mampu memahami sifat-sifat bangun datar", "IV/Genap", "Menggambar Bangun Datar", "Murid mampu menggambar bangun datar dengan ukuran tertentu", "Uraian", "36"),
    @("37", "Peserta didik mampu memahami konsep luas dan volume bangun ruang sederhana", "IV/Genap", "Soal Cerita Volume Balok", "Murid mampu menyelesaikan soal cerita tentang volume balok", "Uraian", "37"),
    @("38", "Peserta didik mampu memahami konsep luas dan volume bangun ruang sederhana", "IV/Genap", "Soal Cerita Luas dan Keliling", "Murid mampu menyelesaikan soal cerita tentang luas dan keliling bangun datar", "Uraian", "38"),
    @("39", "Peserta didik mampu menyajikan dan menginterpretasi data dalam bentuk diagram", "IV/Genap", "Membuat Diagram Batang dari Data", "Murid mampu membuat diagram batang dari data yang diberikan", "Uraian", "39"),
    @("40", "Peserta didik mampu menyajikan dan menginterpretasi data dalam bentuk diagram", "IV/Genap", "Menafsirkan Data Diagram", "Murid mampu menafsirkan data dari diagram batang secara tertulis", "Uraian", "40")
)

Create-KisiKisiDocx -FilePath "D:\CodinganDong\myidea\projects\sibete\kisikisi\sd4\Kisi-kisi ASAT Matematika Kelas 4 smtr 2_25-26.docx" -MataPelajaran "Matematika" -Penyusun "Tim Guru Matematika" -Data $mtk
Write-Output "Matematika done."

# ========================
# 4. IPAS
# ========================
$ipas = @(
    # Bab 4: Mengubah Bentuk Energi (soal 1-12)
    @("1", "Peserta didik mampu memahami transformasi energi dalam kehidupan sehari-hari", "IV/Genap", "Pengertian Energi", "Murid mampu menjelaskan pengertian energi", "PG", "1"),
    @("2", "Peserta didik mampu memahami transformasi energi dalam kehidupan sehari-hari", "IV/Genap", "Macam-macam Energi", "Murid mampu mengidentifikasi macam-macam energi (panas, cahaya, bunyi, gerak, listrik)", "PG", "2"),
    @("3", "Peserta didik mampu memahami transformasi energi dalam kehidupan sehari-hari", "IV/Genap", "Sumber Energi Panas", "Murid mampu mengidentifikasi sumber energi panas", "PG", "3"),
    @("4", "Peserta didik mampu memahami transformasi energi dalam kehidupan sehari-hari", "IV/Genap", "Sumber Energi Cahaya", "Murid mampu mengidentifikasi sumber energi cahaya", "PG", "4"),
    @("5", "Peserta didik mampu memahami transformasi energi dalam kehidupan sehari-hari", "IV/Genap", "Sumber Energi Bunyi", "Murid mampu mengidentifikasi sumber energi bunyi", "PG", "5"),
    @("6", "Peserta didik mampu memahami transformasi energi dalam kehidupan sehari-hari", "IV/Genap", "Sumber Energi Listrik", "Murid mampu mengidentifikasi sumber energi listrik", "PG", "6"),
    @("7", "Peserta didik mampu memahami transformasi energi dalam kehidupan sehari-hari", "IV/Genap", "Perubahan Energi (Transformasi Energi)", "Murid mampu mengidentifikasi contoh perubahan energi dalam kehidupan sehari-hari", "PG", "7"),
    @("8", "Peserta didik mampu memahami transformasi energi dalam kehidupan sehari-hari", "IV/Genap", "Energi Gerak dari Angin", "Murid mampu menjelaskan pemanfaatan energi angin sebagai energi gerak", "PG", "8"),
    @("9", "Peserta didik mampu memahami transformasi energi dalam kehidupan sehari-hari", "IV/Genap", "Energi Matahari", "Murid mampu mengidentifikasi manfaat energi matahari bagi kehidupan", "PG", "9"),
    @("10", "Peserta didik mampu memahami transformasi energi dalam kehidupan sehari-hari", "IV/Genap", "Penghematan Energi", "Murid mampu mengidentifikasi cara menghemat energi dalam kehidupan sehari-hari", "PG", "10"),

    # Bab 5: Cerita tentang Daerahku (soal 11-18)
    @("11", "Peserta didik mampu memahami sejarah dan karakteristik daerah tempat tinggalnya", "IV/Genap", "Sejarah Daerah Tempat Tinggal", "Murid mampu menceritakan sejarah singkat daerah tempat tinggalnya", "PG", "11"),
    @("12", "Peserta didik mampu memahami sejarah dan karakteristik daerah tempat tinggalnya", "IV/Genap", "Peninggalan Sejarah di Daerah", "Murid mampu mengidentifikasi peninggalan sejarah di daerahnya", "PG", "12"),
    @("13", "Peserta didik mampu memahami sejarah dan karakteristik daerah tempat tinggalnya", "IV/Genap", "Tokoh Daerah", "Murid mampu mengidentifikasi tokoh-tokoh daerah dan jasanya", "PG", "13"),
    @("14", "Peserta didik mampu memahami sejarah dan karakteristik daerah tempat tinggalnya", "IV/Genap", "Adat Istiadat Daerah", "Murid mampu mengidentifikasi adat istiadat di daerah tempat tinggalnya", "PG", "14"),
    @("15", "Peserta didik mampu memahami sejarah dan karakteristik daerah tempat tinggalnya", "IV/Genap", "Legenda atau Cerita Rakyat Daerah", "Murid mampu menceritakan legenda atau cerita rakyat dari daerahnya", "PG", "15"),

    # Bab 6: Indonesiaku Kaya Budaya (soal 16-22)
    @("16", "Peserta didik mampu mengidentifikasi kekayaan budaya Indonesia", "IV/Genap", "Keragaman Budaya Indonesia", "Murid mampu mengidentifikasi keragaman budaya di Indonesia", "PG", "16"),
    @("17", "Peserta didik mampu mengidentifikasi kekayaan budaya Indonesia", "IV/Genap", "Tradisi dan Upacara Adat", "Murid mampu mengidentifikasi tradisi dan upacara adat di Indonesia", "PG", "17"),
    @("18", "Peserta didik mampu mengidentifikasi kekayaan budaya Indonesia", "IV/Genap", "Kesenian Daerah", "Murid mampu mengidentifikasi berbagai kesenian daerah di Indonesia", "PG", "18"),
    @("19", "Peserta didik mampu mengidentifikasi kekayaan budaya Indonesia", "IV/Genap", "Warisan Budaya Dunia dari Indonesia", "Murid mampu mengidentifikasi warisan budaya Indonesia yang diakui dunia", "PG", "19"),
    @("20", "Peserta didik mampu mengidentifikasi kekayaan budaya Indonesia", "IV/Genap", "Melestarikan Budaya Indonesia", "Murid mampu menjelaskan cara melestarikan budaya Indonesia", "PG", "20"),

    # Bab 7: Indonesiaku Kaya Alam (soal 21-30)
    @("21", "Peserta didik mampu memahami kekayaan alam Indonesia", "IV/Genap", "Sumber Daya Alam Hayati", "Murid mampu mengidentifikasi sumber daya alam hayati di Indonesia", "PG", "21"),
    @("22", "Peserta didik mampu memahami kekayaan alam Indonesia", "IV/Genap", "Sumber Daya Alam Non Hayati", "Murid mampu mengidentifikasi sumber daya alam non hayati di Indonesia", "PG", "22"),
    @("23", "Peserta didik mampu memahami kekayaan alam Indonesia", "IV/Genap", "Persebaran Sumber Daya Alam", "Murid mampu mengidentifikasi persebaran sumber daya alam di Indonesia", "PG", "23"),
    @("24", "Peserta didik mampu memahami kekayaan alam Indonesia", "IV/Genap", "Pemanfaatan Sumber Daya Alam", "Murid mampu mengidentifikasi cara memanfaatkan sumber daya alam dengan bijak", "PG", "24"),
    @("25", "Peserta didik mampu memahami kekayaan alam Indonesia", "IV/Genap", "Pelestarian Sumber Daya Alam", "Murid mampu mengidentifikasi upaya pelestarian sumber daya alam", "PG", "25"),
    @("26", "Peserta didik mampu memahami kekayaan alam Indonesia", "IV/Genap", "Flora dan Fauna Khas Indonesia", "Murid mampu mengidentifikasi flora dan fauna khas Indonesia", "PG", "26"),
    @("27", "Peserta didik mampu memahami kekayaan alam Indonesia", "IV/Genap", "Ekosistem di Indonesia", "Murid mampu mengidentifikasi jenis-jenis ekosistem di Indonesia", "PG", "27"),
    @("28", "Peserta didik mampu memahami kekayaan alam Indonesia", "IV/Genap", "Daur Hidup Hewan", "Murid mampu menjelaskan daur hidup beberapa jenis hewan", "PG", "28"),
    @("29", "Peserta didik mampu memahami kekayaan alam Indonesia", "IV/Genap", "Hubungan Makhluk Hidup dan Lingkungan", "Murid mampu mengidentifikasi hubungan antara makhluk hidup dan lingkungannya", "PG", "29"),
    @("30", "Peserta didik mampu memahami kekayaan alam Indonesia", "IV/Genap", "Rantai Makanan", "Murid mampu mengidentifikasi rantai makanan dalam suatu ekosistem", "PG", "30"),

    # Bab 8: Membangun Masyarakat yang Beradab (soal 31-40)
    @("31", "Peserta didik mampu memahami nilai-nilai dalam bermasyarakat", "IV/Genap", "Pengertian Norma", "Murid mampu menjelaskan pengertian norma dalam masyarakat", "Isian", "31"),
    @("32", "Peserta didik mampu memahami nilai-nilai dalam bermasyarakat", "IV/Genap", "Macam-macam Norma", "Murid mampu mengidentifikasi macam-macam norma yang berlaku di masyarakat", "Isian", "32"),
    @("33", "Peserta didik mampu memahami nilai-nilai dalam bermasyarakat", "IV/Genap", "Aturan di Lingkungan Sekolah", "Murid mampu mengidentifikasi aturan yang berlaku di sekolah", "Isian", "33"),
    @("34", "Peserta didik mampu memahami nilai-nilai dalam bermasyarakat", "IV/Genap", "Aturan di Lingkungan Keluarga", "Murid mampu mengidentifikasi aturan yang berlaku di keluarga", "Isian", "34"),
    @("35", "Peserta didik mampu memahami nilai-nilai dalam bermasyarakat", "IV/Genap", "Akibat Melanggar Aturan", "Murid mampu menganalisis akibat dari melanggar aturan", "Isian", "35"),
    @("36", "Peserta didik mampu memahami nilai-nilai dalam bermasyarakat", "IV/Genap", "Gotong Royong di Masyarakat", "Murid mampu menjelaskan pentingnya gotong royong di masyarakat", "Uraian", "36"),
    @("37", "Peserta didik mampu memahami nilai-nilai dalam bermasyarakat", "IV/Genap", "Hak Anak di Rumah dan Sekolah", "Murid mampu mengidentifikasi hak-hak anak di rumah dan sekolah", "Uraian", "37"),
    @("38", "Peserta didik mampu memahami nilai-nilai dalam bermasyarakat", "IV/Genap", "Kewajiban Anak di Rumah dan Sekolah", "Murid mampu mengidentifikasi kewajiban anak di rumah dan sekolah", "Uraian", "38"),
    @("39", "Peserta didik mampu memahami nilai-nilai dalam bermasyarakat", "IV/Genap", "Musyawarah dan Mufakat", "Murid mampu menjelaskan pentingnya musyawarah dalam menyelesaikan masalah", "Uraian", "39"),
    @("40", "Peserta didik mampu memahami nilai-nilai dalam bermasyarakat", "IV/Genap", "Nilai-nilai Pancasila dalam Kehidupan", "Murid mampu menganalisis penerapan nilai-nilai Pancasila dalam kehidupan bermasyarakat", "Uraian", "40")
)

Create-KisiKisiDocx -FilePath "D:\CodinganDong\myidea\projects\sibete\kisikisi\sd4\Kisi-kisi ASAT IPAS Kelas 4 smtr 2_25-26.docx" -MataPelajaran "IPAS" -Penyusun "Tim Guru IPAS" -Data $ipas
Write-Output "IPAS done."

# ========================
# 5. PJOK
# ========================
$pjok = @(
    @("1", "Peserta didik mampu mempraktikkan variasi gerak dasar lokomotor, non-lokomotor, dan manipulatif", "IV/Genap", "Gerak Dasar Lokomotor (Berjalan)", "Murid mampu mengidentifikasi variasi gerak dasar berjalan", "PG", "1"),
    @("2", "Peserta didik mampu mempraktikkan variasi gerak dasar lokomotor, non-lokomotor, dan manipulatif", "IV/Genap", "Gerak Dasar Lokomotor (Berlari)", "Murid mampu mengidentifikasi variasi gerak dasar berlari", "PG", "2"),
    @("3", "Peserta didik mampu mempraktikkan variasi gerak dasar lokomotor, non-lokomotor, dan manipulatif", "IV/Genap", "Gerak Dasar Lokomotor (Melompat)", "Murid mampu mengidentifikasi variasi gerak dasar melompat", "PG", "3"),
    @("4", "Peserta didik mampu mempraktikkan variasi gerak dasar lokomotor, non-lokomotor, dan manipulatif", "IV/Genap", "Gerak Dasar Non-Lokomotor (Membungkuk)", "Murid mampu mengidentifikasi variasi gerak dasar membungkuk", "PG", "4"),
    @("5", "Peserta didik mampu mempraktikkan variasi gerak dasar lokomotor, non-lokomotor, dan manipulatif", "IV/Genap", "Gerak Dasar Non-Lokomotor (Memutar)", "Murid mampu mengidentifikasi variasi gerak dasar memutar", "PG", "5"),
    @("6", "Peserta didik mampu mempraktikkan variasi gerak dasar lokomotor, non-lokomotor, dan manipulatif", "IV/Genap", "Gerak Dasar Non-Lokomotor (Mengayun)", "Murid mampu mengidentifikasi variasi gerak dasar mengayun", "PG", "6"),
    @("7", "Peserta didik mampu mempraktikkan variasi gerak dasar lokomotor, non-lokomotor, dan manipulatif", "IV/Genap", "Gerak Dasar Manipulatif (Melempar)", "Murid mampu mengidentifikasi variasi gerak dasar melempar", "PG", "7"),
    @("8", "Peserta didik mampu mempraktikkan variasi gerak dasar lokomotor, non-lokomotor, dan manipulatif", "IV/Genap", "Gerak Dasar Manipulatif (Menangkap)", "Murid mampu mengidentifikasi variasi gerak dasar menangkap", "PG", "8"),
    @("9", "Peserta didik mampu mempraktikkan variasi gerak dasar lokomotor, non-lokomotor, dan manipulatif", "IV/Genap", "Gerak Dasar Manipulatif (Menendang)", "Murid mampu mengidentifikasi variasi gerak dasar menendang", "PG", "9"),
    @("10", "Peserta didik mampu mempraktikkan variasi gerak dasar lokomotor, non-lokomotor, dan manipulatif", "IV/Genap", "Gerak Dasar Manipulatif (Menggiring Bola)", "Murid mampu mengidentifikasi variasi gerak dasar menggiring bola", "PG", "10"),
    @("11", "Peserta didik mampu mempraktikkan aktivitas senam dasar", "IV/Genap", "Senam Lantai (Guling Depan)", "Murid mampu menjelaskan teknik dasar guling depan", "PG", "11"),
    @("12", "Peserta didik mampu mempraktikkan aktivitas senam dasar", "IV/Genap", "Senam Lantai (Guling Belakang)", "Murid mampu menjelaskan teknik dasar guling belakang", "PG", "12"),
    @("13", "Peserta didik mampu mempraktikkan aktivitas senam dasar", "IV/Genap", "Sikap Lilin", "Murid mampu menjelaskan teknik dasar sikap lilin", "PG", "13"),
    @("14", "Peserta didik mampu mempraktikkan aktivitas senam dasar", "IV/Genap", "Kayang", "Murid mampu menjelaskan teknik dasar kayang", "PG", "14"),
    @("15", "Peserta didik mampu mempraktikkan aktivitas senam dasar", "IV/Genap", "Keseimbangan dalam Senam", "Murid mampu mengidentifikasi latihan keseimbangan dalam senam", "PG", "15"),
    @("16", "Peserta didik mampu mempraktikkan aktivitas gerak berirama", "IV/Genap", "Gerak Berirama (Senam Irama)", "Murid mampu mengidentifikasi gerakan dasar senam irama", "PG", "16"),
    @("17", "Peserta didik mampu mempraktikkan aktivitas gerak berirama", "IV/Genap", "Ketukan dan Irama dalam Gerak", "Murid mampu mengidentifikasi ketukan dan irama dalam gerak berirama", "PG", "17"),
    @("18", "Peserta didik mampu mempraktikkan aktivitas gerak berirama", "IV/Genap", "Koordinasi Gerak dan Musik", "Murid mampu mengidentifikasi koordinasi gerak dengan iringan musik", "PG", "18"),
    @("19", "Peserta didik mampu mempraktikkan aktivitas gerak berirama", "IV/Genap", "Gerak Langkah dalam Senam Irama", "Murid mampu mengidentifikasi variasi gerak langkah dalam senam irama", "PG", "19"),
    @("20", "Peserta didik mampu mempraktikkan aktivitas gerak berirama", "IV/Genap", "Gerak Ayunan Lengan dalam Senam Irama", "Murid mampu mengidentifikasi variasi gerak ayunan lengan", "PG", "20"),
    @("21", "Peserta didik mampu mempraktikkan aktivitas olahraga air (renang)", "IV/Genap", "Pengenalan Air dalam Renang", "Murid mampu mengidentifikasi cara beradaptasi dengan air", "PG", "21"),
    @("22", "Peserta didik mampu mempraktikkan aktivitas olahraga air (renang)", "IV/Genap", "Gerakan Dasar Renang (Mengapung)", "Murid mampu mengidentifikasi teknik mengapung di air", "PG", "22"),
    @("23", "Peserta didik mampu mempraktikkan aktivitas olahraga air (renang)", "IV/Genap", "Gerakan Dasar Renang (Meluncur)", "Murid mampu mengidentifikasi teknik meluncur di air", "PG", "23"),
    @("24", "Peserta didik mampu mempraktikkan aktivitas olahraga air (renang)", "IV/Genap", "Pernapasan dalam Renang", "Murid mampu mengidentifikasi teknik pernapasan dalam renang", "PG", "24"),
    @("25", "Peserta didik mampu mempraktikkan aktivitas olahraga air (renang)", "IV/Genap", "Keselamatan di Air", "Murid mampu mengidentifikasi aturan keselamatan saat beraktivitas di air", "PG", "25"),
    @("26", "Peserta didik mampu memahami konsep kebugaran jasmani", "IV/Genap", "Pengertian Kebugaran Jasmani", "Murid mampu menjelaskan pengertian kebugaran jasmani", "PG", "26"),
    @("27", "Peserta didik mampu memahami konsep kebugaran jasmani", "IV/Genap", "Komponen Kebugaran Jasmani", "Murid mampu mengidentifikasi komponen kebugaran jasmani", "PG", "27"),
    @("28", "Peserta didik mampu memahami konsep kebugaran jasmani", "IV/Genap", "Latihan Kekuatan Otot", "Murid mampu mengidentifikasi latihan untuk kekuatan otot", "PG", "28"),
    @("29", "Peserta didik mampu memahami konsep kebugaran jasmani", "IV/Genap", "Latihan Kelenturan", "Murid mampu mengidentifikasi latihan untuk kelenturan tubuh", "PG", "29"),
    @("30", "Peserta didik mampu memahami konsep kebugaran jasmani", "IV/Genap", "Latihan Daya Tahan", "Murid mampu mengidentifikasi latihan untuk daya tahan tubuh", "PG", "30"),
    @("31", "Peserta didik mampu memahami perilaku hidup sehat", "IV/Genap", "Pola Makan Sehat", "Murid mampu mengidentifikasi makanan bergizi seimbang", "Isian", "31"),
    @("32", "Peserta didik mampu memahami perilaku hidup sehat", "IV/Genap", "Kebersihan Pribadi", "Murid mampu mengidentifikasi cara menjaga kebersihan pribadi", "Isian", "32"),
    @("33", "Peserta didik mampu memahami perilaku hidup sehat", "IV/Genap", "Pertolongan Pertama pada Cedera Ringan", "Murid mampu mengidentifikasi cara pertolongan pertama pada cedera ringan", "Isian", "33"),
    @("34", "Peserta didik mampu memahami perilaku hidup sehat", "IV/Genap", "Pemanasan Sebelum Olahraga", "Murid mampu mengidentifikasi manfaat pemanasan sebelum olahraga", "Isian", "34"),
    @("35", "Peserta didik mampu memahami perilaku hidup sehat", "IV/Genap", "Pendinginan Setelah Olahraga", "Murid mampu mengidentifikasi manfaat pendinginan setelah olahraga", "Isian", "35"),
    @("36", "Peserta didik mampu mempraktikkan variasi gerak dasar lokomotor, non-lokomotor, dan manipulatif", "IV/Genap", "Kombinasi Gerak dalam Permainan", "Murid mampu menjelaskan kombinasi gerak dasar dalam permainan sederhana", "Uraian", "36"),
    @("37", "Peserta didik mampu mempraktikkan aktivitas senam dasar", "IV/Genap", "Rangkaian Gerak Senam Sederhana", "Murid mampu menyusun rangkaian gerak senam sederhana", "Uraian", "37"),
    @("38", "Peserta didik mampu memahami konsep kebugaran jasmani", "IV/Genap", "Menjaga Kebugaran Jasmani", "Murid mampu menjelaskan cara menjaga kebugaran jasmani", "Uraian", "38"),
    @("39", "Peserta didik mampu memahami perilaku hidup sehat", "IV/Genap", "Pentingnya Istirahat dan Tidur", "Murid mampu menjelaskan pentingnya istirahat dan tidur bagi kesehatan", "Uraian", "39"),
    @("40", "Peserta didik mampu mempraktikkan aktivitas olahraga air (renang)", "IV/Genap", "Manfaat Renang bagi Kesehatan", "Murid mampu menganalisis manfaat renang bagi kesehatan tubuh", "Uraian", "40")
)

Create-KisiKisiDocx -FilePath "D:\CodinganDong\myidea\projects\sibete\kisikisi\sd4\Kisi-kisi ASAT PJOK Kelas 4 smtr 2_25-26.docx" -MataPelajaran "PJOK" -Penyusun "Tim Guru PJOK" -Data $pjok
Write-Output "PJOK done."

# ========================
# 6. SBdP (Seni Budaya dan Prakarya)
# ========================
$sbdp = @(
    # Seni Rupa (soal 1-18)
    @("1", "Peserta didik mampu mengeksplorasi dan menciptakan karya seni rupa", "IV/Genap", "Pengertian Seni Rupa", "Murid mampu menjelaskan pengertian seni rupa", "PG", "1"),
    @("2", "Peserta didik mampu mengeksplorasi dan menciptakan karya seni rupa", "IV/Genap", "Unsur-unsur Seni Rupa (Titik, Garis, Bidang)", "Murid mampu mengidentifikasi unsur-unsur seni rupa", "PG", "2"),
    @("3", "Peserta didik mampu mengeksplorasi dan menciptakan karya seni rupa", "IV/Genap", "Unsur-unsur Seni Rupa (Warna, Tekstur, Ruang)", "Murid mampu mengidentifikasi unsur warna, tekstur, dan ruang", "PG", "3"),
    @("4", "Peserta didik mampu mengeksplorasi dan menciptakan karya seni rupa", "IV/Genap", "Warna Primer, Sekunder, dan Tersier", "Murid mampu mengidentifikasi jenis-jenis warna", "PG", "4"),
    @("5", "Peserta didik mampu mengeksplorasi dan menciptakan karya seni rupa", "IV/Genap", "Menggambar Ekspresif", "Murid mampu mengidentifikasi teknik menggambar ekspresif", "PG", "5"),
    @("6", "Peserta didik mampu mengeksplorasi dan menciptakan karya seni rupa", "IV/Genap", "Mewarnai dengan Teknik Basah dan Kering", "Murid mampu mengidentifikasi teknik mewarnai basah dan kering", "PG", "6"),
    @("7", "Peserta didik mampu mengeksplorasi dan menciptakan karya seni rupa", "IV/Genap", "Kolase", "Murid mampu menjelaskan teknik membuat kolase", "PG", "7"),
    @("8", "Peserta didik mampu mengeksplorasi dan menciptakan karya seni rupa", "IV/Genap", "Mozaik", "Murid mampu menjelaskan teknik membuat mozaik", "PG", "8"),
    @("9", "Peserta didik mampu mengeksplorasi dan menciptakan karya seni rupa", "IV/Genap", "Aplikasi (Karya Tempel)", "Murid mampu mengidentifikasi teknik aplikasi dalam seni rupa", "PG", "9"),
    @("10", "Peserta didik mampu mengeksplorasi dan menciptakan karya seni rupa", "IV/Genap", "Membuat Cetakan Sederhana", "Murid mampu mengidentifikasi teknik membuat cetakan sederhana", "PG", "10"),
    @("11", "Peserta didik mampu mengeksplorasi dan menciptakan karya seni rupa", "IV/Genap", "Karya 3 Dimensi dari Bahan Alam", "Murid mampu mengidentifikasi bahan alam untuk karya 3 dimensi", "PG", "11"),
    @("12", "Peserta didik mampu mengeksplorasi dan menciptakan karya seni rupa", "IV/Genap", "Mengapresiasi Karya Seni Rupa", "Murid mampu mengapresiasi karya seni rupa dengan memberikan tanggapan", "PG", "12"),

    # Seni Musik (soal 13-24)
    @("13", "Peserta didik mampu memahami dan mempraktikkan seni musik", "IV/Genap", "Pengertian Seni Musik", "Murid mampu menjelaskan pengertian seni musik", "PG", "13"),
    @("14", "Peserta didik mampu memahami dan mempraktikkan seni musik", "IV/Genap", "Alat Musik Ritmis", "Murid mampu mengidentifikasi alat musik ritmis", "PG", "14"),
    @("15", "Peserta didik mampu memahami dan mempraktikkan seni musik", "IV/Genap", "Alat Musik Melodis", "Murid mampu mengidentifikasi alat musik melodis", "PG", "15"),
    @("16", "Peserta didik mampu memahami dan mempraktikkan seni musik", "IV/Genap", "Tangga Nada Diatonis Mayor", "Murid mampu mengidentifikasi tangga nada diatonis mayor", "PG", "16"),
    @("17", "Peserta didik mampu memahami dan mempraktikkan seni musik", "IV/Genap", "Tangga Nada Diatonis Minor", "Murid mampu mengidentifikasi tangga nada diatonis minor", "PG", "17"),
    @("18", "Peserta didik mampu memahami dan mempraktikkan seni musik", "IV/Genap", "Irama dan Birama dalam Musik", "Murid mampu mengidentifikasi irama dan birama dalam lagu", "PG", "18"),
    @("19", "Peserta didik mampu memahami dan mempraktikkan seni musik", "IV/Genap", "Menyanyikan Lagu sesuai Tempo", "Murid mampu menyanyikan lagu dengan tempo yang tepat", "PG", "19"),
    @("20", "Peserta didik mampu memahami dan mempraktikkan seni musik", "IV/Genap", "Menyanyikan Lagu Wajib Nasional", "Murid mampu mengidentifikasi lagu wajib nasional", "PG", "20"),

    # Seni Tari (soal 21-30)
    @("21", "Peserta didik mampu memahami dan mempraktikkan seni tari", "IV/Genap", "Pengertian Seni Tari", "Murid mampu menjelaskan pengertian seni tari", "PG", "21"),
    @("22", "Peserta didik mampu memahami dan mempraktikkan seni tari", "IV/Genap", "Gerak Dasar Tari", "Murid mampu mengidentifikasi gerak dasar tari (gerak kepala, tangan, kaki)", "PG", "22"),
    @("23", "Peserta didik mampu memahami dan mempraktikkan seni tari", "IV/Genap", "Properti Tari", "Murid mampu mengidentifikasi properti yang digunakan dalam tarian", "PG", "23"),
    @("24", "Peserta didik mampu memahami dan mempraktikkan seni tari", "IV/Genap", "Pola Lantai dalam Tari", "Murid mampu mengidentifikasi pola lantai dalam tarian", "PG", "24"),
    @("25", "Peserta didik mampu memahami dan mempraktikkan seni tari", "IV/Genap", "Tari Tradisional Daerah", "Murid mampu mengidentifikasi nama tarian tradisional dari berbagai daerah", "PG", "25"),
    @("26", "Peserta didik mampu memahami dan mempraktikkan seni tari", "IV/Genap", "Tari Kreasi Daerah", "Murid mampu mengidentifikasi ciri-ciri tari kreasi daerah", "PG", "26"),
    @("27", "Peserta didik mampu memahami dan mempraktikkan seni tari", "IV/Genap", "Unsur Pendukung Tari (Tata Rias, Busana, Musik)", "Murid mampu mengidentifikasi unsur pendukung dalam pertunjukan tari", "PG", "27"),
    @("28", "Peserta didik mampu memahami dan mempraktikkan seni tari", "IV/Genap", "Apresiasi Karya Tari", "Murid mampu memberikan tanggapan terhadap pertunjukan tari", "PG", "28"),

    # Seni Teater dan Prakarya (soal 29-40)
    @("29", "Peserta didik mampu memahami dan mempraktikkan seni teater sederhana", "IV/Genap", "Pengertian Seni Teater", "Murid mampu menjelaskan pengertian seni teater", "PG", "29"),
    @("30", "Peserta didik mampu memahami dan mempraktikkan seni teater sederhana", "IV/Genap", "Bermain Peran (Role Playing)", "Murid mampu mengidentifikasi teknik bermain peran sederhana", "PG", "30"),
    @("31", "Peserta didik mampu memahami dan mempraktikkan seni teater sederhana", "IV/Genap", "Ekspresi Wajah dan Gestur", "Murid mampu mengidentifikasi ekspresi wajah dan gestur dalam bermain peran", "Isian", "31"),
    @("32", "Peserta didik mampu mengeksplorasi dan menciptakan karya seni rupa", "IV/Genap", "Membuat Boneka dari Bahan Bekas", "Murid mampu mengidentifikasi langkah membuat boneka dari bahan bekas", "Isian", "32"),
    @("33", "Peserta didik mampu mengeksplorasi dan menciptakan karya seni rupa", "IV/Genap", "Membuat Hiasan dari Bahan Alam", "Murid mampu mengidentifikasi langkah membuat hiasan dari bahan alam", "Isian", "33"),
    @("34", "Peserta didik mampu mengeksplorasi dan menciptakan karya seni rupa", "IV/Genap", "Teknik Lipat (Origami)", "Murid mampu mengidentifikasi teknik dasar melipat kertas", "Isian", "34"),
    @("35", "Peserta didik mampu memahami dan mempraktikkan seni musik", "IV/Genap", "Membuat Alat Musik Sederhana", "Murid mampu mengidentifikasi bahan untuk membuat alat musik sederhana", "Isian", "35"),
    @("36", "Peserta didik mampu mengeksplorasi dan menciptakan karya seni rupa", "IV/Genap", "Membuat Karya Seni dari Bahan Bekas", "Murid mampu membuat karya seni dari bahan bekas dengan kreatif", "Uraian", "36"),
    @("37", "Peserta didik mampu memahami dan mempraktikkan seni tari", "IV/Genap", "Menampilkan Tari Sederhana", "Murid mampu menampilkan gerak tari sederhana secara berkelompok", "Uraian", "37"),
    @("38", "Peserta didik mampu memahami dan mempraktikkan seni teater sederhana", "IV/Genap", "Pementasan Drama Sederhana", "Murid mampu memerankan tokoh dalam drama sederhana", "Uraian", "38"),
    @("39", "Peserta didik mampu memahami dan mempraktikkan seni musik", "IV/Genap", "Menampilkan Permainan Alat Musik", "Murid mampu menampilkan permainan alat musik ritmis secara sederhana", "Uraian", "39"),
    @("40", "Peserta didik mampu memahami dan mempraktikkan seni tari", "IV/Genap", "Kreasi Tari dengan Iringan", "Murid mampu mengkreasikan gerak tari dengan iringan musik", "Uraian", "40")
)

Create-KisiKisiDocx -FilePath "D:\CodinganDong\myidea\projects\sibete\kisikisi\sd4\Kisi-kisi ASAT SBdP Kelas 4 smtr 2_25-26.docx" -MataPelajaran "Seni Budaya dan Prakarya" -Penyusun "Tim Guru SBdP" -Data $sbdp
Write-Output "SBdP done."

# ========================
# 7. BAHASA INGGRIS
# ========================
$bing = @(
    @("1", "Peserta didik mampu memahami dan menggunakan kosakata terkait benda di kelas", "IV/Genap", "Things in the Classroom (Benda di Kelas)", "Murid mampu mengidentifikasi nama benda-benda di kelas dalam bahasa Inggris", "PG", "1"),
    @("2", "Peserta didik mampu memahami dan menggunakan kosakata terkait benda di kelas", "IV/Genap", "Singular and Plural Nouns (Kata Benda Tunggal dan Jamak)", "Murid mampu mengidentifikasi bentuk tunggal dan jamak kata benda", "PG", "2"),
    @("3", "Peserta didik mampu memahami dan menggunakan kosakata terkait benda di kelas", "IV/Genap", "Prepositions of Place (in, on, under, behind)", "Murid mampu mengidentifikasi penggunaan kata depan tempat dalam kalimat", "PG", "3"),
    @("4", "Peserta didik mampu memahami dan menggunakan kosakata terkait benda di kelas", "IV/Genap", "This is / These are", "Murid mampu menggunakan this is dan these are dengan tepat", "PG", "4"),
    @("5", "Peserta didik mampu memahami dan menggunakan kosakata terkait benda di kelas", "IV/Genap", "Simple Classroom Commands", "Murid mampu mengidentifikasi perintah sederhana di kelas dalam bahasa Inggris", "PG", "5"),
    @("6", "Peserta didik mampu memahami dan menggunakan kosakata terkait hobi dan kegiatan", "IV/Genap", "Hobbies and Activities (Hobi dan Kegiatan)", "Murid mampu mengidentifikasi nama-nama hobi dalam bahasa Inggris", "PG", "6"),
    @("7", "Peserta didik mampu memahami dan menggunakan kosakata terkait hobi dan kegiatan", "IV/Genap", "Like / Don't Like (Menyukai / Tidak Menyukai)", "Murid mampu menggunakan like dan don't like dalam kalimat sederhana", "PG", "7"),
    @("8", "Peserta didik mampu memahami dan menggunakan kosakata terkait hobi dan kegiatan", "IV/Genap", "Present Simple Tense (Simple Present)", "Murid mampu menggunakan simple present tense dalam kalimat sederhana", "PG", "8"),
    @("9", "Peserta didik mampu memahami dan menggunakan kosakata terkait hobi dan kegiatan", "IV/Genap", "Asking about Hobbies (Bertanya tentang Hobi)", "Murid mampu membuat pertanyaan tentang hobi dalam bahasa Inggris", "PG", "9"),
    @("10", "Peserta didik mampu memahami dan menggunakan kosakata terkait hobi dan kegiatan", "IV/Genap", "Telling Time (Menyebutkan Waktu)", "Murid mampu menyebutkan waktu dalam bahasa Inggris", "PG", "10"),
    @("11", "Peserta didik mampu memahami dan menggunakan kosakata terkait hewan", "IV/Genap", "Animals (Hewan)", "Murid mampu mengidentifikasi nama-nama hewan dalam bahasa Inggris", "PG", "11"),
    @("12", "Peserta didik mampu memahami dan menggunakan kosakata terkait hewan", "IV/Genap", "Parts of Animal Body (Bagian Tubuh Hewan)", "Murid mampu mengidentifikasi bagian tubuh hewan dalam bahasa Inggris", "PG", "12"),
    @("13", "Peserta didik mampu memahami dan menggunakan kosakata terkait hewan", "IV/Genap", "Has / Have (Memiliki)", "Murid mampu menggunakan has dan have dalam kalimat sederhana", "PG", "13"),
    @("14", "Peserta didik mampu memahami dan menggunakan kosakata terkait hewan", "IV/Genap", "Adjectives for Animals (Kata Sifat untuk Hewan)", "Murid mampu mengidentifikasi kata sifat untuk mendeskripsikan hewan", "PG", "14"),
    @("15", "Peserta didik mampu memahami dan menggunakan kosakata terkait hewan", "IV/Genap", "Can / Can't (Dapat / Tidak Dapat)", "Murid mampu menggunakan can dan can't untuk kemampuan hewan", "PG", "15"),
    @("16", "Peserta didik mampu memahami dan menggunakan kosakata terkait bagian tubuh", "IV/Genap", "Parts of Body (Bagian Tubuh)", "Murid mampu mengidentifikasi bagian-bagian tubuh dalam bahasa Inggris", "PG", "16"),
    @("17", "Peserta didik mampu memahami dan menggunakan kosakata terkait bagian tubuh", "IV/Genap", "Describing People (Mendeskripsikan Orang)", "Murid mampu mendeskripsikan ciri fisik seseorang dalam bahasa Inggris", "PG", "17"),
    @("18", "Peserta didik mampu memahami dan menggunakan kosakata terkait bagian tubuh", "IV/Genap", "To be (am, is, are) untuk Deskripsi Fisik", "Murid mampu menggunakan to be dalam mendeskripsikan fisik", "PG", "18"),
    @("19", "Peserta didik mampu memahami dan menggunakan kosakata terkait bagian tubuh", "IV/Genap", "Sense Verbs (see, hear, smell, taste, touch)", "Murid mampu mengidentifikasi kata kerja indra dalam bahasa Inggris", "PG", "19"),
    @("20", "Peserta didik mampu memahami dan menggunakan kosakata terkait bagian tubuh", "IV/Genap", "How many (Berapa Banyak)", "Murid mampu menggunakan how many untuk menanyakan jumlah", "PG", "20"),
    @("21", "Peserta didik mampu memahami dan menggunakan kosakata terkait rumah", "IV/Genap", "My House (Rumahku)", "Murid mampu mengidentifikasi nama-nama ruangan di rumah dalam bahasa Inggris", "PG", "21"),
    @("22", "Peserta didik mampu memahami dan menggunakan kosakata terkait rumah", "IV/Genap", "Things at Home (Benda di Rumah)", "Murid mampu mengidentifikasi nama benda di rumah dalam bahasa Inggris", "PG", "22"),
    @("23", "Peserta didik mampu memahami dan menggunakan kosakata terkait rumah", "IV/Genap", "Where is / Where are (Menanyakan Letak)", "Murid mampu menanyakan letak benda menggunakan where is/are", "PG", "23"),
    @("24", "Peserta didik mampu memahami dan menggunakan kosakata terkait rumah", "IV/Genap", "There is / There are", "Murid mampu menggunakan there is dan there are dengan tepat", "PG", "24"),
    @("25", "Peserta didik mampu memahami dan menggunakan kosakata terkait rumah", "IV/Genap", "Family Members (Anggota Keluarga)", "Murid mampu mengidentifikasi anggota keluarga dalam bahasa Inggris", "PG", "25"),
    @("26", "Peserta didik mampu memahami dan menggunakan kosakata terkait makanan dan minuman", "IV/Genap", "Food and Drinks (Makanan dan Minuman)", "Murid mampu mengidentifikasi nama makanan dan minuman dalam bahasa Inggris", "PG", "26"),
    @("27", "Peserta didik mampu memahami dan menggunakan kosakata terkait makanan dan minuman", "IV/Genap", "Do you like...? / Does he like...?", "Murid mampu membuat pertanyaan tentang kesukaan dalam bahasa Inggris", "PG", "27"),
    @("28", "Peserta didik mampu memahami dan menggunakan kosakata terkait makanan dan minuman", "IV/Genap", "Countable and Uncountable Nouns", "Murid mampu mengidentifikasi kata benda yang dapat dihitung dan tidak", "PG", "28"),
    @("29", "Peserta didik mampu memahami dan menggunakan kosakata terkait makanan dan minuman", "IV/Genap", "Some / Any", "Murid mampu menggunakan some dan any dalam kalimat", "PG", "29"),
    @("30", "Peserta didik mampu memahami dan menggunakan ekspresi sederhana sehari-hari", "IV/Genap", "Greetings and Farewells (Salam dan Ucapan Perpisahan)", "Murid mampu mengidentifikasi ungkapan salam dan perpisahan", "PG", "30"),
    @("31", "Peserta didik mampu memahami dan menggunakan ekspresi sederhana sehari-hari", "IV/Genap", "Polite Expressions (Tolong, Maaf, Terima Kasih)", "Murid mampu menggunakan ungkapan sopan dalam bahasa Inggris", "Isian", "31"),
    @("32", "Peserta didik mampu memahami dan menggunakan ekspresi sederhana sehari-hari", "IV/Genap", "Days and Months (Hari dan Bulan)", "Murid mampu mengidentifikasi nama hari dan bulan dalam bahasa Inggris", "Isian", "32"),
    @("33", "Peserta didik mampu memahami dan menggunakan ekspresi sederhana sehari-hari", "IV/Genap", "Numbers 1-100 (Angka 1-100)", "Murid mampu menyebutkan angka 1-100 dalam bahasa Inggris", "Isian", "33"),
    @("34", "Peserta didik mampu memahami dan menggunakan ekspresi sederhana sehari-hari", "IV/Genap", "Colors (Warna)", "Murid mampu mengidentifikasi nama warna dalam bahasa Inggris", "Isian", "34"),
    @("35", "Peserta didik mampu memahami dan menggunakan ekspresi sederhana sehari-hari", "IV/Genap", "Weather (Cuaca)", "Murid mampu mengidentifikasi kosakata cuaca dalam bahasa Inggris", "Isian", "35"),
    @("36", "Peserta didik mampu memahami teks deskriptif sederhana", "IV/Genap", "Reading Simple Descriptive Text", "Murid mampu membaca dan memahami teks deskriptif sederhana", "Uraian", "36"),
    @("37", "Peserta didik mampu menulis kalimat sederhana", "IV/Genap", "Writing Simple Sentences", "Murid mampu menulis kalimat sederhana tentang topik yang dikenal", "Uraian", "37"),
    @("38", "Peserta didik mampu memahami teks deskriptif sederhana", "IV/Genap", "Describing My Pet (Mendeskripsikan Hewan Peliharaan)", "Murid mampu mendeskripsikan hewan peliharaan dalam beberapa kalimat", "Uraian", "38"),
    @("39", "Peserta didik mampu memahami teks deskriptif sederhana", "IV/Genap", "Describing My Friend", "Murid mampu mendeskripsikan teman dalam bahasa Inggris sederhana", "Uraian", "39"),
    @("40", "Peserta didik mampu memahami dan menggunakan ekspresi sederhana sehari-hari", "IV/Genap", "Simple Dialog (Percakapan Sederhana)", "Murid mampu melengkapi percakapan sederhana dengan ekspresi yang tepat", "Uraian", "40")
)

Create-KisiKisiDocx -FilePath "D:\CodinganDong\myidea\projects\sibete\kisikisi\sd4\Kisi-kisi ASAT Bahasa Inggris Kelas 4 smtr 2_25-26.docx" -MataPelajaran "Bahasa Inggris" -Penyusun "Tim Guru Bahasa Inggris" -Data $bing
Write-Output "Bahasa Inggris done."

# ========================
# 8. PAI
# ========================
$pai = @(
    # Bab 6: Mari Beriman (soal 1-15)
    @("1", "Peserta didik mampu memahami rukun iman dan makna beriman kepada malaikat", "IV/Genap", "Pengertian Iman kepada Malaikat", "Murid mampu menjelaskan pengertian iman kepada malaikat", "PG", "1"),
    @("2", "Peserta didik mampu memahami rukun iman dan makna beriman kepada malaikat", "IV/Genap", "Rukun Iman", "Murid mampu mengidentifikasi enam rukun iman dengan benar", "PG", "2"),
    @("3", "Peserta didik mampu memahami rukun iman dan makna beriman kepada malaikat", "IV/Genap", "Nama-nama Malaikat Allah", "Murid mampu mengidentifikasi nama-nama malaikat Allah SWT", "PG", "3"),
    @("4", "Peserta didik mampu memahami rukun iman dan makna beriman kepada malaikat", "IV/Genap", "Tugas Malaikat Jibril", "Murid mampu menjelaskan tugas Malaikat Jibril", "PG", "4"),
    @("5", "Peserta didik mampu memahami rukun iman dan makna beriman kepada malaikat", "IV/Genap", "Tugas Malaikat Mikail", "Murid mampu menjelaskan tugas Malaikat Mikail", "PG", "5"),
    @("6", "Peserta didik mampu memahami rukun iman dan makna beriman kepada malaikat", "IV/Genap", "Tugas Malaikat Raqib dan Atid", "Murid mampu menjelaskan tugas Malaikat Raqib dan Atid", "PG", "6"),
    @("7", "Peserta didik mampu memahami rukun iman dan makna beriman kepada malaikat", "IV/Genap", "Tugas Malaikat Munkar dan Nakir", "Murid mampu menjelaskan tugas Malaikat Munkar dan Nakir", "PG", "7"),
    @("8", "Peserta didik mampu memahami rukun iman dan makna beriman kepada malaikat", "IV/Genap", "Tugas Malaikat Malik dan Ridwan", "Murid mampu menjelaskan tugas Malaikat Malik dan Ridwan", "PG", "8"),
    @("9", "Peserta didik mampu memahami rukun iman dan makna beriman kepada malaikat", "IV/Genap", "Hikmah Beriman kepada Malaikat", "Murid mampu mengidentifikasi hikmah beriman kepada malaikat", "PG", "9"),
    @("10", "Peserta didik mampu memahami rukun iman dan makna beriman kepada malaikat", "IV/Genap", "Perilaku yang Mencerminkan Iman kepada Malaikat", "Murid mampu mengidentifikasi perilaku yang mencerminkan iman kepada malaikat", "PG", "10"),

    # Bab 7: Indahnya Saling Menghormati (soal 11-25)
    @("11", "Peserta didik mampu memahami pentingnya saling menghormati sesama", "IV/Genap", "Pengertian Hormat dan Patuh", "Murid mampu menjelaskan pengertian hormat dan patuh", "PG", "11"),
    @("12", "Peserta didik mampu memahami pentingnya saling menghormati sesama", "IV/Genap", "Hormat kepada Orang Tua", "Murid mampu mengidentifikasi cara hormat kepada orang tua", "PG", "12"),
    @("13", "Peserta didik mampu memahami pentingnya saling menghormati sesama", "IV/Genap", "Hormat kepada Guru", "Murid mampu mengidentifikasi cara hormat kepada guru", "PG", "13"),
    @("14", "Peserta didik mampu memahami pentingnya saling menghormati sesama", "IV/Genap", "Hormat kepada Teman", "Murid mampu mengidentifikasi cara menghormati teman sebaya", "PG", "14"),
    @("15", "Peserta didik mampu memahami pentingnya saling menghormati sesama", "IV/Genap", "Hormat kepada yang Lebih Tua", "Murid mampu mengidentifikasi sikap hormat kepada yang lebih tua", "PG", "15"),
    @("16", "Peserta didik mampu memahami pentingnya saling menghormati sesama", "IV/Genap", "Sayang kepada yang Lebih Muda", "Murid mampu mengidentifikasi sikap sayang kepada yang lebih muda", "PG", "16"),
    @("17", "Peserta didik mampu memahami pentingnya saling menghormati sesama", "IV/Genap", "Adab Berbicara yang Baik", "Murid mampu mengidentifikasi adab berbicara yang baik", "PG", "17"),
    @("18", "Peserta didik mampu memahami pentingnya saling menghormati sesama", "IV/Genap", "Adab Berteman", "Murid mampu mengidentifikasi adab berteman dalam Islam", "PG", "18"),
    @("19", "Peserta didik mampu memahami pentingnya saling menghormati sesama", "IV/Genap", "Manfaat Saling Menghormati", "Murid mampu menganalisis manfaat saling menghormati dalam kehidupan", "PG", "19"),
    @("20", "Peserta didik mampu memahami pentingnya saling menghormati sesama", "IV/Genap", "Akibat Tidak Menghormati Orang Lain", "Murid mampu menganalisis akibat tidak menghormati orang lain", "PG", "20"),

    # Bab 8: Kisah Nabi (soal 21-30)
    @("21", "Peserta didik mampu memahami kisah teladan para nabi dan rasul", "IV/Genap", "Pengertian Nabi dan Rasul", "Murid mampu menjelaskan pengertian nabi dan rasul", "PG", "21"),
    @("22", "Peserta didik mampu memahami kisah teladan para nabi dan rasul", "IV/Genap", "Kisah Nabi Adam AS", "Murid mampu menceritakan kisah Nabi Adam AS", "PG", "22"),
    @("23", "Peserta didik mampu memahami kisah teladan para nabi dan rasul", "IV/Genap", "Kisah Nabi Nuh AS", "Murid mampu menceritakan kisah Nabi Nuh AS", "PG", "23"),
    @("24", "Peserta didik mampu memahami kisah teladan para nabi dan rasul", "IV/Genap", "Kisah Nabi Ibrahim AS", "Murid mampu menceritakan kisah Nabi Ibrahim AS", "PG", "24"),
    @("25", "Peserta didik mampu memahami kisah teladan para nabi dan rasul", "IV/Genap", "Kisah Nabi Musa AS", "Murid mampu menceritakan kisah Nabi Musa AS", "PG", "25"),
    @("26", "Peserta didik mampu memahami kisah teladan para nabi dan rasul", "IV/Genap", "Kisah Nabi Isa AS", "Murid mampu menceritakan kisah Nabi Isa AS", "PG", "26"),
    @("27", "Peserta didik mampu memahami kisah teladan para nabi dan rasul", "IV/Genap", "Kisah Nabi Muhammad SAW (Masa Kecil)", "Murid mampu menceritakan masa kecil Nabi Muhammad SAW", "PG", "27"),
    @("28", "Peserta didik mampu memahami kisah teladan para nabi dan rasul", "IV/Genap", "Sifat-sifat Nabi Muhammad SAW", "Murid mampu mengidentifikasi sifat-sifat Nabi Muhammad SAW", "PG", "28"),
    @("29", "Peserta didik mampu memahami kisah teladan para nabi dan rasul", "IV/Genap", "Keteladanan dari Kisah Nabi", "Murid mampu mengidentifikasi keteladanan dari kisah para nabi", "PG", "29"),
    @("30", "Peserta didik mampu memahami kisah teladan para nabi dan rasul", "IV/Genap", "Hikmah Mempelajari Kisah Nabi", "Murid mampu menjelaskan hikmah mempelajari kisah para nabi", "PG", "30"),

    # Bab 9: Puasa Ramadan (soal 31-40)
    @("31", "Peserta didik mampu memahami ibadah puasa Ramadan", "IV/Genap", "Pengertian Puasa Ramadan", "Murid mampu menjelaskan pengertian puasa Ramadan", "Isian", "31"),
    @("32", "Peserta didik mampu memahami ibadah puasa Ramadan", "IV/Genap", "Hukum Puasa Ramadan", "Murid mampu menjelaskan hukum puasa Ramadan", "Isian", "32"),
    @("33", "Peserta didik mampu memahami ibadah puasa Ramadan", "IV/Genap", "Syarat Wajib Puasa", "Murid mampu mengidentifikasi syarat wajib puasa", "Isian", "33"),
    @("34", "Peserta didik mampu memahami ibadah puasa Ramadan", "IV/Genap", "Rukun Puasa", "Murid mampu mengidentifikasi rukun puasa Ramadan", "Isian", "34"),
    @("35", "Peserta didik mampu memahami ibadah puasa Ramadan", "IV/Genap", "Hal-hal yang Membatalkan Puasa", "Murid mampu mengidentifikasi hal-hal yang membatalkan puasa", "Isian", "35"),
    @("36", "Peserta didik mampu memahami ibadah puasa Ramadan", "IV/Genap", "Manfaat Puasa bagi Kesehatan", "Murid mampu menjelaskan manfaat puasa bagi kesehatan", "Uraian", "36"),
    @("37", "Peserta didik mampu memahami ibadah puasa Ramadan", "IV/Genap", "Amalan Sunnah di Bulan Ramadan", "Murid mampu mengidentifikasi amalan sunnah di bulan Ramadan", "Uraian", "37"),
    @("38", "Peserta didik mampu memahami ibadah puasa Ramadan", "IV/Genap", "Niat Puasa Ramadan", "Murid mampu melafalkan niat puasa Ramadan", "Uraian", "38"),
    @("39", "Peserta didik mampu memahami ibadah puasa Ramadan", "IV/Genap", "Hikmah Puasa Ramadan", "Murid mampu menjelaskan hikmah puasa Ramadan", "Uraian", "39"),
    @("40", "Peserta didik mampu memahami ibadah puasa Ramadan", "IV/Genap", "Perilaku Selama Bulan Ramadan", "Murid mampu mengidentifikasi perilaku baik selama bulan Ramadan", "Uraian", "40")
)

Create-KisiKisiDocx -FilePath "D:\CodinganDong\myidea\projects\sibete\kisikisi\sd4\Kisi-kisi ASAT PAI Kelas 4 smtr 2_25-26.docx" -MataPelajaran "Pendidikan Agama Islam dan Budi Pekerti" -Penyusun "Tim Guru PAI" -Data $pai
Write-Output "PAI done."

Write-Output "`n=== ALL KISI-KISI FILES CREATED SUCCESSFULLY ==="

