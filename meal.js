var 表格連結 = "https://docs.google.com/spreadsheets/d/1czlEGBo6SR7m45IeGHx6QmGq7hXOXjTADZlzeKkRqj4/edit?usp=sharing";
var 店家資訊, 篩選結果, 停輪時間, 停輪位置;
var 最大圈數 = 3;
var 最大轉動時間 = 5000;
var halfWidth = 轉盤.width * 0.5;
var ctx = 轉盤.getContext("2d");
ctx.lineWidth = 1.5;
ctx.font = "28px Arial";
ctx.textAlign = "center";
ctx.textBaseline = "middle";
ctx.setTransform(1, 0, 0, 1, halfWidth, halfWidth);

var shuffle = function(a) {
	if (a.length < 2) {
		return;
	};
	var i, j, x;
	i = Math.floor(Math.random() * a.length);
	x = a[i];
	for (j = a.length - 1; j > 0; --j) {
		a[i] = a[j];
		i = Math.floor(Math.random() * j);
		a[j] = a[i];
	};
	a[0] = x;
};

var 按鍵禁能 = function(flag) {
	重設轉盤按鈕.disabled = flag;
	開始轉動按鈕.disabled = flag;
};

var 重設篩選結果 = function() {
	var 星期 = +星期選單.selectedOptions[0].value;
	var 人數 = +人數選單.selectedOptions[0].value;
	var 價位 = +價位選單.selectedOptions[0].value;
	var 時間 = +時間選單.selectedOptions[0].value;
	var 結果列表 = [];
	for (var i = 0; i < 店家資訊.length; ++i) {
		if (
			店家資訊[i].星期[星期] == "v"
			&& 店家資訊[i].人數 >= 人數
			&& 店家資訊[i].價位 <= 價位
			&& 店家資訊[i].時間 <= 時間
		) 結果列表.push(店家資訊[i]);
	};
	if (結果列表.length) {
		shuffle(結果列表);
		篩選結果 = 結果列表;
		return true;
	} else {
		return false;
	};
};

var 繪製轉盤 = function(phase) {
	var n, i;
	ctx.clearRect(-halfWidth, -halfWidth, 2 * halfWidth, 2 * halfWidth);
	ctx.rotate(2 * Math.PI * -phase);
	n = 篩選結果.length;
	for (i = 0; i < n; ++i) {
		ctx.beginPath();
		ctx.arc(0, 0, 600, 0, 2 * Math.PI / n);
		ctx.lineTo(0, 0);
		ctx.closePath();
		ctx.fillStyle = "hsl(" + 360 * i / n + ", 55%, 75%)";
		ctx.fill();
		ctx.stroke();
		ctx.rotate(Math.PI / n);
		ctx.fillStyle = "black";
		ctx.fillText(篩選結果[i].名稱, 370, 0);
		ctx.rotate(Math.PI / n);
	};
	ctx.setTransform(1, 0, 0, 1, halfWidth, halfWidth);
	ctx.beginPath();
	ctx.arc(0, 0, 100, 0, 2 * Math.PI);
	ctx.fillStyle = "gray";
	ctx.fill();
	ctx.stroke();
};

var 顯示訊息 = function(htmlText) {
	結果資訊.innerHTML = htmlText;
};

var 重設轉盤 = function() {
	if (重設篩選結果()) {
		停輪位置 = 0;
		繪製轉盤(0);
		顯示訊息("重設轉盤或開始轉動。");
	} else {
		顯示訊息("沒有符合篩選條件的店家！");
	};
	按鍵禁能(false);
};

var 顯示轉動結果 = function() {
	var index = Math.floor(停輪位置 * 篩選結果.length);
	var 結果 = 篩選結果[index];
	顯示訊息([
		結果.名稱,
		"種類：" + 結果.種類,
		"價位：" + 結果.價位 + "元",
		"地址：" + 結果.地址,
		"步行時間：" + 結果.時間 + "分鐘",
		"價目表：" + (結果.價目表.length ?
			"<a target='_blank' href='" + 結果.價目表 + "'>連結&gt;&gt;<a>" : ""),
		"備註：" + 結果.備註,
	].join("<br>"));
};

var 轉動 = function() {
	var 剩餘時間 = 停輪時間 - Date.now();
	if (剩餘時間 > 0) {
		var 剩餘圈數 = (剩餘時間 / 最大轉動時間) ** 2 * 最大圈數;
		繪製轉盤(停輪位置 - 剩餘圈數);
		requestAnimationFrame(轉動);
	} else {
		繪製轉盤(停輪位置);
		顯示轉動結果();
		按鍵禁能(false);
	};
};

var 開始轉動 = function() {
	var 剩餘圈數 = 最大圈數 - Math.random();
	var 剩餘時間 = Math.sqrt(剩餘圈數 / 最大圈數) * 最大轉動時間;
	停輪位置 = (停輪位置 + 剩餘圈數) % 1;
	停輪時間 = Date.now() + 剩餘時間;
	顯示訊息("祝您好運！");
	轉動();
};

var 設定店家資訊 = function(jsonText) {
	var data = JSON.parse(jsonText);
	店家資訊 = [];
	for (var i = 0; i < data.length; ++i) {
		店家資訊.push({
			"名稱": data[i][0],
			"星期": data[i].slice(1, 8),
			"人數": +data[i][8],
			"時間": +data[i][9],
			"價位": +data[i][10],
			"種類": data[i][11],
			"地址": data[i][12],
			"價目表": data[i][13],
			"備註": data[i][14],
		});
	};
};

var 初始化 = function() {
	星期選單.selectedIndex = (new Date()).getDay();
	var request = new XMLHttpRequest();
	request.onreadystatechange = function() {
		if (this.readyState == 4 && this.status == 200) {
			設定店家資訊(this.responseText);
			重設轉盤();
		};
	};
	request.open("POST", "https://script.google.com/a/gosmio.biz/macros/s/AKfycbwaujHkqNjDHLxF1QTLHEOmc2PtGci5eNWkL2HGpJX7I_ChKOA/exec", true);
	request.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
	request.send(location.search.slice(1));
	編輯連結.href = 表格連結;
	編輯連結.style.visibility = "visible";
};

重設轉盤按鈕.onclick = function() {
	按鍵禁能(true);
	setTimeout(重設轉盤, 0);
};

開始轉動按鈕.onclick = function() {
	按鍵禁能(true);
	setTimeout(開始轉動, 0);
};

初始化();