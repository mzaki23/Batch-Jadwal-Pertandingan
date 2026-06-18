#target photoshop

// 1. Polyfill Trim untuk JavaScript ES3 (ExtendScript)
if (!String.prototype.trim) {
    String.prototype.trim = function () {
        return this.replace(/^\s+|\s+$/g, '');
    };
}

// Global cache untuk menyimpan referensi layer agar pencarian instan
var layerCache = {};
var missingLogos = [];

function main() {
    if (app.documents.length == 0) {
        alert("Buka file PSD template desain Anda terlebih dahulu!");
        return;
    }

    var doc = app.activeDocument;
    
    var textLayerNames = ["- Abaikan / Kosongkan -"];
    var soLayerNames = ["- Abaikan / Kosongkan -"];

    // Mengambil daftar layer sekaligus mengisi cache awal
    function getLayers(container) {
        for (var i = 0; i < container.layers.length; i++) {
            var l = container.layers[i];
            layerCache[l.name] = l; // Masukkan ke cache
            if (l.typename == "LayerSet") {
                getLayers(l);
            } else {
                if (l.kind == LayerKind.TEXT) textLayerNames.push(l.name);
                if (l.kind == LayerKind.SMARTOBJECT) soLayerNames.push(l.name);
            }
        }
    }
    getLayers(doc); 

    var win = new Window("dialog", "Automasi Jadwal V7 - Final Custom Naming");
    win.orientation = "column";
    win.alignChildren = ["fill", "top"];

    // PANEL 1
    var pnlFiles = win.add("panel", undefined, "1. Arahkan File Data & Folder Target");
    pnlFiles.orientation = "column";
    pnlFiles.alignChildren = ["fill", "top"];
    pnlFiles.margins = 15;

    var grpCsv = pnlFiles.add("group");
    grpCsv.add("statictext", [0,0,100,20], "Data CSV:");
    var txtCsv = grpCsv.add("edittext", [0,0,250,20], "");
    var btnCsv = grpCsv.add("button", undefined, "Pilih File...");
    var csvFile = null;
    btnCsv.onClick = function() {
        csvFile = File.openDialog("Arahkan ke file Data CSV...", "*.csv");
        if (csvFile) txtCsv.text = csvFile.fsName;
    }

    var grpLogo = pnlFiles.add("group");
    grpLogo.add("statictext", [0,0,100,20], "Folder Logo SVG:");
    var txtLogo = grpLogo.add("edittext", [0,0,250,20], "");
    var btnLogo = grpLogo.add("button", undefined, "Pilih Folder...");
    var logoFolder = null;
    btnLogo.onClick = function() {
        logoFolder = Folder.selectDialog("Arahkan ke folder berisi file SVG bendera");
        if (logoFolder) txtLogo.text = logoFolder.fsName;
    }

    var grpExport = pnlFiles.add("group");
    grpExport.add("statictext", [0,0,100,20], "Folder Export:");
    var txtExport = grpExport.add("edittext", [0,0,250,20], "");
    var btnExport = grpExport.add("button", undefined, "Pilih Folder...");
    var exportFolder = null;
    btnExport.onClick = function() {
        exportFolder = Folder.selectDialog("Arahkan ke folder tujuan export JPG");
        if (exportFolder) txtExport.text = exportFolder.fsName;
    }

    // PANEL 2
    var pnlLayers = win.add("panel", undefined, "2. Arahkan Target Layer di PSD");
    pnlLayers.orientation = "row";
    pnlLayers.alignChildren = ["fill", "top"];
    pnlLayers.margins = 15;

    function addDropdown(parent, label, list, defaultName) {
        var grp = parent.add("group");
        grp.add("statictext", [0,0,80,20], label);
        var dd = grp.add("dropdownlist", [0,0,140,20], list);
        dd.selection = 0; 
        for(var i = 0; i < list.length; i++) {
            if(list[i] == defaultName) {
                dd.selection = i;
                break;
            }
        }
        return dd;
    }

    var colKiri = pnlLayers.add("group");
    colKiri.orientation = "column";
    colKiri.alignChildren = ["fill", "top"];
    colKiri.add("statictext", undefined, "=== PERTANDINGAN KIRI ===");
    var ddT1Kiri = addDropdown(colKiri, "Teks Tim 1:", textLayerNames, "Tim1_Kiri");
    var ddT2Kiri = addDropdown(colKiri, "Teks Tim 2:", textLayerNames, "Tim2_Kiri");
    var ddJKiri = addDropdown(colKiri, "Teks Jadwal:", textLayerNames, "Jadwal_Kiri");
    var ddL1Kiri = addDropdown(colKiri, "Logo Tim 1:", soLayerNames, "Logo1_Kiri");
    var ddL2Kiri = addDropdown(colKiri, "Logo Tim 2:", soLayerNames, "Logo2_Kiri");

    var colKanan = pnlLayers.add("group");
    colKanan.orientation = "column";
    colKanan.alignChildren = ["fill", "top"];
    colKanan.add("statictext", undefined, "=== PERTANDINGAN KANAN ===");
    var ddT1Kanan = addDropdown(colKanan, "Teks Tim 1:", textLayerNames, "Tim1_Kanan");
    var ddT2Kanan = addDropdown(colKanan, "Teks Tim 2:", textLayerNames, "Tim2_Kanan");
    var ddJKanan = addDropdown(colKanan, "Teks Jadwal:", textLayerNames, "Jadwal_Kanan");
    var ddL1Kanan = addDropdown(colKanan, "Logo Tim 1:", soLayerNames, "Logo1_Kanan");
    var ddL2Kanan = addDropdown(colKanan, "Logo Tim 2:", soLayerNames, "Logo2_Kanan");

    // PANEL 3 (CUSTOM NAMING)
    var pnlName = win.add("panel", undefined, "3. Pengaturan Format Nama File");
    pnlName.orientation = "column";
    pnlName.alignChildren = ["fill", "top"];
    pnlName.margins = 15;

    var grpPrefix = pnlName.add("group");
    grpPrefix.add("statictext", [0,0,120,20], "Awalan (Prefix):");
    var txtPrefix = grpPrefix.add("edittext", [0,0,280,20], "260612 - FIFA World Cup - ");

    var grpSuffix = pnlName.add("group");
    grpSuffix.add("statictext", [0,0,120,20], "Akhiran (Suffix):");
    var txtSuffix = grpSuffix.add("edittext", [0,0,280,20], "_869x538px (Pop Up Banner)");
    
    var infoText = pnlName.add("statictext", undefined, "*Tengahnya akan diisi otomatis: Tanggal Match (Misal: 13 Juni 2026)");
    infoText.graphics.foregroundColor = infoText.graphics.newPen (win.graphics.PenType.SOLID_COLOR, [0.5, 0.5, 0.5], 1);

    var grpBtns = win.add("group");
    grpBtns.alignment = "center";
    var btnRun = grpBtns.add("button", undefined, "Jalankan Automasi", {name: "ok"});
    var btnCancel = grpBtns.add("button", undefined, "Batal");

    btnRun.onClick = function() {
        if (!csvFile || !logoFolder || !exportFolder) {
            alert("Oops! Harap arahkan File CSV, Folder Logo, dan Folder Export terlebih dahulu.");
            return;
        }
        win.close(1);
    }

    btnCancel.onClick = function() { win.close(0); }

    if (win.show() == 1) {
        // Simpan History State awal PSD agar template kembali bersih setelah script selesai
        var originalHistoryState = doc.activeHistoryState;
        
        try {
            processCSV(doc, csvFile, logoFolder, exportFolder, {
                t1Kiri: ddT1Kiri.selection.text, t2Kiri: ddT2Kiri.selection.text, jKiri: ddJKiri.selection.text,
                l1Kiri: ddL1Kiri.selection.text, l2Kiri: ddL2Kiri.selection.text,
                t1Kanan: ddT1Kanan.selection.text, t2Kanan: ddT2Kanan.selection.text, jKanan: ddJKanan.selection.text,
                l1Kanan: ddL1Kanan.selection.text, l2Kanan: ddL2Kanan.selection.text
            }, txtPrefix.text, txtSuffix.text);
        } catch (err) {
            alert("Terjadi kesalahan saat memproses data:\n" + err.message);
        } finally {
            // Revert PSD ke kondisi semula sebelum automasi dijalankan
            doc.activeHistoryState = originalHistoryState;
        }
    }
}

function processCSV(doc, csvFile, logoFolder, exportFolder, map, prefixStr, suffixStr) {
    var startTime = new Date().getTime(); // Hitung waktu mulai eksekusi

    csvFile.encoding = "UTF-8"; // Mencegah karakter aksen rusak saat dibaca
    csvFile.open('r');
    var csvContent = csvFile.read();
    csvFile.close();

    var lines = csvContent.replace(/\r\n|\r/g, '\n').split('\n');
    var imageCounter = 1;
    missingLogos = []; // Reset list logo hilang

    for (var i = 1; i < lines.length; i += 2) {
        if (lines[i] === "" || lines[i] === undefined) continue;
        
        var sep = (lines[i].indexOf(';') > -1) ? ';' : ',';
        var dataKiri = lines[i].split(sep);
        var dataKanan = (i + 1 < lines.length && lines[i+1] !== "") ? lines[i + 1].split(sep) : null;
        var abaikan = "- Abaikan / Kosongkan -";

        // Pemrosesan Sisi Kiri
        if (dataKiri.length >= 7) {
            if (map.t1Kiri != abaikan) updateTextLayer(map.t1Kiri, dataKiri[3].toUpperCase());
            if (map.t2Kiri != abaikan) updateTextLayer(map.t2Kiri, dataKiri[4].toUpperCase());
            if (map.jKiri != abaikan) updateTextLayer(map.jKiri, formatJadwal(dataKiri[0], dataKiri[1], dataKiri[2]));
            
            if (map.l1Kiri != abaikan) replaceSmartObject(doc, map.l1Kiri, logoFolder + "/" + dataKiri[5].trim());
            if (map.l2Kiri != abaikan) replaceSmartObject(doc, map.l2Kiri, logoFolder + "/" + dataKiri[6].trim());
        }

        // Pemrosesan Sisi Kanan
        if (dataKanan && dataKanan.length >= 7) {
            if (map.t1Kanan != abaikan) updateTextLayer(map.t1Kanan, dataKanan[3].toUpperCase());
            if (map.t2Kanan != abaikan) updateTextLayer(map.t2Kanan, dataKanan[4].toUpperCase());
            if (map.jKanan != abaikan) updateTextLayer(map.jKanan, formatJadwal(dataKanan[0], dataKanan[1], dataKanan[2]));
            
            if (map.l1Kanan != abaikan) {
                setLayerVisibility(map.l1Kanan, true);
                replaceSmartObject(doc, map.l1Kanan, logoFolder + "/" + dataKanan[5].trim());
            }
            if (map.l2Kanan != abaikan) {
                setLayerVisibility(map.l2Kanan, true);
                replaceSmartObject(doc, map.l2Kanan, logoFolder + "/" + dataKanan[6].trim());
            }
        } else {
            // Sembunyikan dan kosongkan sisi kanan jika tidak ada data match kedua
            if (map.t1Kanan != abaikan) updateTextLayer(map.t1Kanan, "");
            if (map.t2Kanan != abaikan) updateTextLayer(map.t2Kanan, "");
            if (map.jKanan != abaikan) updateTextLayer(map.jKanan, "");
            if (map.l1Kanan != abaikan) setLayerVisibility(map.l1Kanan, false);
            if (map.l2Kanan != abaikan) setLayerVisibility(map.l2Kanan, false);
        }

        // Dapatkan nama tanggal terformat
        var tglMatch = formatNamaBulan(dataKiri[1].trim());
        
        // --- MEMBUAT FOLDER TANGGAL SECARA OTOMATIS ---
        var targetFolder = new Folder(exportFolder + "/" + tglMatch);
        if (!targetFolder.exists) {
            targetFolder.create();
        }
        
        // Simpan langsung ke folder tanggal yang bersangkutan
        var fileName = targetFolder + "/" + prefixStr + tglMatch + suffixStr + ".jpg";
        
        saveJPEG(doc, fileName);
        imageCounter++;
    }

    var endTime = new Date().getTime();
    var duration = ((endTime - startTime) / 1000).toFixed(1); // Hitung total waktu proses

    // Tampilkan rangkuman hasil proses
    var summaryMsg = "Proses Selesai dalam " + duration + " detik!\n\n" + (imageCounter - 1) + " gambar telah di-generate dan dikelompokkan ke folder masing-masing.";
    if (missingLogos.length > 0) {
        summaryMsg += "\n\n⚠️ Peringatan: Ada beberapa logo yang tidak ditemukan:\n- " + missingLogos.slice(0, 10).join("\n- ");
        if (missingLogos.length > 10) {
            summaryMsg += "\n...dan " + (missingLogos.length - 10) + " logo lainnya.";
        }
    }
    alert(summaryMsg);
}

// Mengambil referensi layer dari cache
function getLayer(name) {
    if (layerCache[name]) return layerCache[name];
    return null;
}

function updateTextLayer(layerName, newText) {
    try {
        var layer = getLayer(layerName);
        if (layer && layer.kind == LayerKind.TEXT) {
            layer.textItem.contents = newText.trim();
            layer.name = layerName; // Pertahankan nama asli layer
        }
    } catch (e) {}
}

function setLayerVisibility(layerName, visible) {
    try {
        var layer = getLayer(layerName);
        if (layer) layer.visible = visible;
    } catch (e) {}
}

function replaceSmartObject(doc, layerName, filePath) {
    try {
        var layer = getLayer(layerName);
        if (layer && layer.kind == LayerKind.SMARTOBJECT) {
            var fileObj = new File(filePath);
            if (!fileObj.exists) {
                // Catat logo yang hilang agar user tahu
                missingLogos.push(fileObj.name);
                return; 
            }
            
            doc.activeLayer = layer;
            var idplacedLayerReplaceContents = stringIDToTypeID("placedLayerReplaceContents");
            var desc = new ActionDescriptor();
            var idnull = charIDToTypeID("null");
            desc.putPath(idnull, fileObj);
            executeAction(idplacedLayerReplaceContents, desc, DialogModes.NO);
            
            doc.activeLayer.name = layerName;
        }
    } catch (e) {}
}

// Konversi nama bulan secara dinamis & lengkap untuk nama file
function formatNamaBulan(tglStr) {
    var bulanIndo = {
        "JAN": "Januari", "FEB": "Februari", "MAR": "Maret", "APR": "April",
        "MAY": "Mei", "MEI": "Mei", "JUN": "Juni", "JUL": "Juli",
        "AUG": "Agustus", "AGU": "Agustus", "SEP": "September",
        "OCT": "Oktober", "OKT": "Oktober", "NOV": "November", "DEC": "Desember", "DES": "Desember"
    };
    
    var words = tglStr.split(" ");
    for (var i = 0; i < words.length; i++) {
        var upperWord = words[i].toUpperCase();
        if (bulanIndo[upperWord]) {
            words[i] = bulanIndo[upperWord];
        }
    }
    return words.join(" ");
}

function formatJadwal(hari, tgl, jam) {
    var hariFull = hari.toUpperCase().trim();
    var namaHari = {
        "JUM": "JUMAT", "SAB": "SABTU", "MIN": "MINGGU", 
        "SEN": "SENIN", "SEL": "SELASA", "RAB": "RABU", "KAM": "KAMIS"
    };
    if (namaHari[hariFull]) hariFull = namaHari[hariFull];

    // Konversi nama bulan untuk tampilan teks di PSD
    var tglUpper = formatNamaBulan(tgl.trim()).toUpperCase();
    var jamFormat = jam.replace(":", ".").trim();

    return hariFull + ", " + tglUpper + " - PUKUL " + jamFormat + " WIB";
}

function saveJPEG(doc, path) {
    var file = new File(path);
    var options = new JPEGSaveOptions();
    options.quality = 10;
    doc.saveAs(file, options, true, Extension.LOWERCASE);
}

main();