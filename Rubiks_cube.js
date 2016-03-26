//variables about the 3D scene
var outerMesh, innerMesh; 
var outerMaterial, outerTexture, innerMaterial, innerTexture;
var planeMaterial, planeTexture, planeMesh;

//variables to turn faces
var offset;
var count;

//variables about the Instagram info
var image_index = 0;
var imgArray = [];
var likesArray = [];
var likesArrayInt = [];
var insImageCount = 0;
var maxLike;
var minLike = 0;
//var avgLikes = 0;

//variables for music API
var spotifyApi; 
var echonestApi; 
var bars;
var barsIndex = 0;
var analyser;
var beats = [];
var beats_index = 0;
var load_beats_finish = false;

//DOM elements
var audioTag; 
var songInput;
var turnButton;
var playButton;
var getFileButton;
var uploadedFile;
var tagInput;
var defaultMusic;

//variables to load local file
var fileName = "";
var dataArray = [];

//play default misic?
var isDefault = false;

//variables about particles
var particleCount;
var particles;
var pMaterial
var particleSystem;
var particleAnimation;


$(document).ready ( function() {
	init();
});



//initial the scene
function init() {

	spotifyApi = new SpotifyWebApi();
	echonestApi = new EchonestApi();

	//get the element of DOM and create their event listeners
	audioTag = document.querySelector('#audio');
	tagInput = document.querySelector('#tagname');
	turnButton = document.querySelector('#turning_button');
	playButton = document.querySelector('#playButton');
	getFileButton = document.querySelector('#file_button');
	uploadedFile = document.querySelector('#get_file');
	defaultMusic = document.querySelector('#defaultMusic');
	bars = document.querySelector('#bars');

	window.addEventListener('resize', onWindowResize, false);
	turnButton.addEventListener('click', play_and_turn, false);
	getFileButton.addEventListener('click', ChooseFile, false);
	defaultMusic.addEventListener('click', hitDefalutMusic, false);

	uploadedFile.onchange = getFileName;

}

//hit the "PLAY DEFAULT" button, run this
function ChooseFile () {
	//console.log('choose file button get!');
	uploadedFile.click();
	isDefault = false;

}

//run the defualt music
function hitDefalutMusic () {
	isDefault = true; 
	//console.log(isDefault);
}

//get the file
function getFileName () {
	
	//get the file name from the URL
	fileName = this.value;
	var startingIndex = fileName.lastIndexOf('fakepath');
	var endingIndex = fileName.lastIndexOf('.');

	if(startingIndex >= 0) 
		fileName = fileName.substring(startingIndex + 9, endingIndex);

	SearchSong();

	//console.log(fileName);
}


//use the Spotify API to get the uri of this song, 
//then use this uri to get the analysis info from echonest
function SearchSong () {

	//use the file name to search
	spotifyApi.searchTracks(
		fileName.trim(), {limit: 1}).then(function (results) {
			var track = results.tracks.items[0];

			//use the uri to get the analysis information
			echonestApi.getSongAudioSummaryBySpotifyUri(track.uri).then(function(echoNestResult) {

				//get the analysis URL from the result
				var analysisURL = echoNestResult.response.songs[0].audio_summary.analysis_url;

				//get the analysis JSON
				$.getJSON(analysisURL, function(analyze_json) {
					//console.log(analyze_json);

					//get the beats structure and the bars structure
					beats = analyze_json.beats;
					bars = analyze_json.bars;
					load_beats_finish = true;
				})
			});

		});

		
}

//create the 3D scene
function createScene () {

	//set camera
	camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 1, 1000);
	camera.position.z = 400;

	//create scene
	scene = new THREE.Scene();

	//load the original textures for the two cubes
	load_outerTexture('bg2.png');
	load_innerTexture('bg2.png');

	//create cubes
	var outerGeometry = new THREE.BoxGeometry(200, 200, 200);
	var innerGeometry = new THREE.BoxGeometry(100, 100, 100);

	//create the music wave as a plane
	var planeGeometry = new THREE.PlaneGeometry(600, 50, 300, 1);

	//create materials for these geometries
	outerMaterial = new THREE.MeshBasicMaterial( { map: outerTexture, transparent: true});
	innerMaterial = new THREE.MeshBasicMaterial( { map: innerTexture, transparent: true});
	//innerMaterial = new THREE.MeshBasicMaterial( {color: Math.random() * 0xffffff, transparent: true, opacity: 0.2});
	planeMaterial = new THREE.MeshBasicMaterial({color: Math.random() * 0xffffff, side: THREE.DoubleSide, transparent: true, opacity: 0.2});
	
	//make it transparent
	outerMaterial.side = THREE.DoubleSide;
	innerMaterial.side = THREE.DoubleSide;

	//create mesh for the plane 
	planeMesh = new THREE.Mesh(planeGeometry, planeMaterial);
	//make it perpendicular to the users
	planeMesh.rotation.x = Math.PI / 2;
	//add to the scene
	scene.add(planeMesh);
	
	//create mesh for the inner cube
	innerMesh = new THREE.Mesh(innerGeometry, innerMaterial);
	//add to the scene
	scene.add(innerMesh);
	//rotate
	innerMesh.rotation.y += Math.PI / 4;

	//create the mesh for the outer cube
	outerMesh = new THREE.Mesh(outerGeometry, outerMaterial);
	//add to the scene
	scene.add(outerMesh);

	//createParticle();

	//set the renderer for the scene
	renderer = new THREE.WebGLRenderer();
	renderer.setPixelRatio(window.devicePixelRatio);
	renderer.setSize(window.innerWidth, window.innerHeight);
	renderer.sortObjects = false;
	//set the backgrond color
	renderer.setClearColor( 0xf5f5f5, 1 );
	//add to DOM
	document.body.appendChild(renderer.domElement);

	origin_animate();
}

//create particles
function createParticle () {
		//add 10 at a time
		particleCount = 10;

		//set geometry and material
		particles = new THREE.Geometry();
		pMaterial = new THREE.ParticleBasicMaterial({
		color: 0xffffff, 
		size: 10, 
		map: THREE.ImageUtils.loadTexture("particle.svg"), 
		blending: THREE.AdditiveBlending,
		transparent: true,
		opacity: 0.5
	});

	//randomly set the position
	for (var p = 0; p < particleCount; p++)
	{
		var pX = Math.random() * 500 - 250;
		var pY = Math.random() * 500 - 250;
		var pZ = Math.random() * 500 - 250;
		var particle = new THREE.Vector3(pX, pY,pZ);

		//add the new particle to the particle array
		particles.vertices.push(particle);
	}

		//add to system
		particleSystem = new THREE.ParticleSystem(
		particles, 
		pMaterial);

	particleSystem.sortParticles = true;
	scene.add(particleSystem);

	updateParticles();
}

//update the positions of the particles, aka animation
function updateParticles() {

	particleSystem.rotation.y += 0.1;

	renderer.render(scene, camera);

	particleAnimation = requestAnimationFrame(updateParticles);

}

//get the instagram images with tag using the instafeed.js API
function getInsTagImage (tag) 
{
	var imageArray = [];
	var InsImages = new Instafeed ({
		get: 'tagged', 
		tagName: tag,
		//maximum number of images the Instagram API permits
		limit: 33,  
		template: '<a href="{{link}}" target="_blank" id="{{id}}"><img src="{{image}}" /><span class="likes">{{likes}}</span></a>', 
		//clientId: '86adb601550740a0bacb2e8523313653'
		accessToken: '270724729.467ede5.7b52fc2a786446a1b357365995a4e225', 


		//when loaded, run this callback function
		after: function () {
			$('#instafeed').children().each(function () {
				//get the image and the likes of this image
				var target = $(this).find("img").attr("src");
				var like_info = $(this).find("likes").context.innerText;
				
				//push this info into the corresponding array
				imageArray.push(target.substr(2, target.length));
				likesArray.push(like_info);

				//get the quantity of the images
				insImageCount ++;

				$('#instafeed').hide();
			});

			//store the number of the most like and least like
			minLike = maxLike = parseInt(likesArray[0]);


			//get the likes of each image and update maxLike and minLike
			for (var i = 0; i < likesArray.length; i++)
			{
				likesArrayInt.push(parseInt(likesArray[i]));
				//avgLikes += likesArrayInt[i];

				if(likesArrayInt[i] > maxLike)
					maxLike = likesArrayInt[i];

				if(likesArrayInt[i] < minLike)
					minLike = likesArrayInt[i];
			}


			//if there is a large gap between minLike and maxLike, make it more balanced
			if((maxLike - minLike) > 50)
				maxLike = minLike + 50;

		}


		

	});

	InsImages.run();

	return imageArray;
	
}


//when resize the window, update the scene
function onWindowResize() {
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();

	renderer.setSize(window.innerWidth, window.innerHeight);
}

//detect whether it hits the beat or bar
function detectAudioTime () {

	//when it hits the beat, turn the cube and get another beat
	if (beats[beats_index].start <= audioTag.currentTime) {
		turningCube();
		beats_index++;
	}

	//if it hits the bar, create new particles
	if(bars[barsIndex].start <= audioTag.currentTime) {
		createParticle();
		barsIndex++;
	}
	else
		//when it is not the bar time, stop the animation of the particles
		cancelAnimationFrame(particleAnimation);
		//renderer.setClearColor( 0xffffff, 1 );
}


//when hit the "start" button, go to this function
function play_and_turn () {
	//console.log(tagInput.value);
	
	//if not inputing the tag, alert to input
	if(tagInput.value == "")
		alert("Please input Instagram tagname");

	//else, create the 3D scene and get the Instagram images
	else
	{
		createScene();
		//console.log("play and turn");
		imgArray = getInsTagImage(tagInput.value);
	
		//if uploaded music, get the URL of the music
		if(!isDefault) {

		//browser will create a virtual URL for the file, so using FileReader to get the real URL
		var reader = new FileReader();
		//console.log("not default");
		reader.onload = function (e) {
			//set the URL to the source of the <audio> in DOM
			audioTag.src = e.target.result;
			audioTag.crossOrigin = "anonymous";
			//console.log("reader onload");
		}

		reader.readAsDataURL(uploadedFile.files[0]);
		//console.log(reader.readAsDataURL(uploadedFile.files[0]));
	}
	//if "PLAY DEFAULT" chosen, get the default music
		else {
			//console.log("default");
			fileName = "Glee Cast - Rather Be";
			audioTag.src = "Glee Cast - Rather Be.mp3";

			SearchSong();

		}

	getWaveform();

	}
}

//using the web audio API to get the frequency wave of the music
function getWaveform () {
	var audioCtx = new (window.AudioContext || window.webkitAudioContext)(); //context
	analyser = audioCtx.createAnalyser(); 
	dataArray = new Uint8Array(analyser.frequencyBinCount);
	//console.log(dataArray.length);

	//link to the <audio> in DOM
	var source = audioCtx.createMediaElementSource(audioTag); //input
	
	
	audioTag.addEventListener("canplay", function () {

		source.connect(analyser);

		//get the frequency data 
		analyser.getByteTimeDomainData(dataArray);

		//connect to output
		analyser.connect(audioCtx.destination);

		//play the music
		audioTag.play();

		//draw the instant wave
		drawWave();
	});
}


//draw the instant wave
function drawWave (ts) {

	//get the wave information at this moment
	analyser.getByteFrequencyData(dataArray);

	//make the animation
	requestAnimationFrame(drawWave);

	var vLength = planeMesh.geometry.vertices.length;  //the qunatity of vertices


	//set the wave info to the plane mesh
	for(var i = 0; i < vLength; i++)
	{
		var v = planeMesh.geometry.vertices[i];

		//make it stay at the middle of the window
		v.z = dataArray[i + 50] / 2 - 50;
		//console.log(v.z);
	}

	planeMesh.geometry.verticesNeedUpdate = true;
	renderer.render(scene, camera);


}

//turn the cube
function turningCube() {
	event.preventDefault();

	//select the turning direction randomly
	var direction = Math.floor(Math.random() * 4);

	offset = 0;
	count = 0;
	if(direction == 0)
		spinning_right();
	else if (direction == 1)
		spinning_up();
	else if (direction == 2)
		spinning_left();
	else if (direction == 3)
		spinning_down();

	//create the textures for the cubes
	create_texture();

}

//load texture for the outer cube
function load_outerTexture (url) {
	outerTexture = new THREE.TextureLoader().load(url);
}

//load texture for the inner cube
function load_innerTexture (url) {
	innerTexture = new THREE.TextureLoader().load(url);
	//console.log(innerTexture);

}

//create the textures
function create_texture() {

	var data;
	var imageData;
	var imageObj = new Image();
	imageObj.crossOrigin="anonymous";

	//get the real URL of the images
	imageObj.src = "http://" + imgArray[image_index];


	//use the like info of this image to scale the inner cube
	image_like = likesArrayInt[image_index];

	if(image_like > maxLike)
		image_like = maxLike;

	var scale_para = 2 / (maxLike - minLike) * (image_like - minLike);

	//prevent the inner cube to disappear
	if(scale_para < 0.1)
		scale_para = 0.1;

	innerMesh.scale.x = scale_para;
	innerMesh.scale.y = scale_para;
	innerMesh.scale.z = scale_para;

	

	var canvas = document.getElementById("temp");
	var avgCanvas = document.getElementById("temp2");
	var innerCanvas = document.getElementById("temp3");


	var ctx = canvas.getContext("2d");
	var avgCtx = avgCanvas.getContext("2d");
	var innerCtx = innerCanvas.getContext("2d");

	//create image to store the proccessed image
	var avgImageData = avgCtx.createImageData(canvas.width, canvas.height);
	var avgData = avgImageData.data;

	var innerImageData = innerCtx.createImageData(canvas.width, canvas.height);
	var innerData = innerImageData.data;

	//count the average color of the image
	var colorCountR = 0, colorCountG = 0, colorCountB = 0;

	imageObj.onload = function () {
		ctx.drawImage(imageObj, 0, 0);

		//get the image data
		imageData = ctx.getImageData(0, 0, imageObj.width, imageObj.height);
		data = imageData.data;

		//console.log(insImageCount);

		image_index++;
		if(image_index >= insImageCount)
			image_index = 0;

		//store the average color of each row
		var row_color_r = 0;
		var row_color_g = 0;
		var row_color_b = 0;

		var row_color_r_array = [];
		var row_color_g_array = [];
		var row_color_b_array = [];

		
		//calculate the average color and the average color of each row
		for(var r = 0; r < imageObj.height; r++)
		{
			for(var i = 0; i < (imageObj.width * 4); i += 4)
			{
				row_color_r += data[r * imageObj.width * 4 + i];
				row_color_g  += data[r * imageObj.width * 4 + i + 1];
				row_color_b += data[r * imageObj.width * 4 + i + 2];
			}

			colorCountR += row_color_r;
			colorCountG += row_color_g;
			colorCountB += row_color_b;

			row_color_r = row_color_r / imageObj.width;
			row_color_g = row_color_g / imageObj.width;
			row_color_b = row_color_b / imageObj.width;

			//console.log("r:" + row_color_r);

			row_color_r_array.push(row_color_r);
			row_color_g_array.push(row_color_g);
			row_color_b_array.push(row_color_b);

			//console.log(row_color_r_array[r]);

			row_color_r = 0;
			row_color_g = 0;
			row_color_b = 0;

		}


		//use the average row color to set the outer cube faces
		for(var r = 0; r < imageObj.height; r++)
		{

		for(var i = 0; i < (imageObj.width * 4); i += 4)
		{
			if(r % 10 < 5)
			{
			avgData[r * imageObj.width * 4 + i] = row_color_r_array[r];
			avgData[r * imageObj.width * 4 + i + 1] = row_color_g_array[r]
			avgData[r * imageObj.width * 4 + i + 2] = row_color_b_array[r];
			avgData[r * imageObj.width * 4 + i + 3] = 100;
			}

			else {
			avgData[r * imageObj.width * 4 + i] = 255;
			avgData[r * imageObj.width * 4 + i + 1] = 255;
			avgData[r * imageObj.width * 4 + i + 2] = 255;
			avgData[r * imageObj.width * 4 + i + 3] = 0;
			}

		}
	}

	colorCountR = colorCountR / (imageObj.height * imageObj.width);
	colorCountG = colorCountG / (imageObj.height * imageObj.width);
	colorCountB = colorCountB / (imageObj.height * imageObj.width);


	//use the average color to set the inner cube face
	for(var r = 0; r < imageObj.height; r++)
		{

		for(var i = 0; i < (imageObj.width * 4); i += 4)
		{

			if(r % 4 < 2)
			{
			innerData[r * imageObj.width * 4 + i] = colorCountR;
			innerData[r * imageObj.width * 4 + i + 1] = colorCountG;
			innerData[r * imageObj.width * 4 + i + 2] = colorCountB;
			innerData[r * imageObj.width * 4 + i + 3] = 100;
			}

			else {
			innerData[r * imageObj.width * 4 + i] = 255;
			innerData[r * imageObj.width * 4 + i + 1] = 255;
			innerData[r * imageObj.width * 4 + i + 2] = 255;
			innerData[r * imageObj.width * 4 + i + 3] = 0;
			}

		}
	}

	
	//put the average color to canvas
	avgCtx.putImageData(avgImageData, 0, 0);
	innerCtx.putImageData(innerImageData, 0, 0);

	//get the URL of the image of the outer cube face
	var image_url = avgCanvas.toDataURL("image/png");
	//set to the outer cube texture
	load_outerTexture(image_url);

	//get the URL of the image of the inner cube face
	var innerImageUrl = innerCanvas.toDataURL("image/png");
	//set it to the inner cube face
	load_innerTexture(innerImageUrl);

	//map the textures
	outerMaterial.map = outerTexture;
	outerMaterial.side = THREE.DoubleSide;

	innerMaterial.map = innerTexture;
	innerMaterial.side = THREE.DoubleSide;

	//innerMaterial.color.setRGB(colorCountR / 255.0, colorCountG / 255.0, colorCountB / 255.0);
	//set the average color of the imgae to the music wave plane
	planeMaterial.color.setRGB(colorCountR / 255.0, colorCountG / 255.0, colorCountB / 255.0);

	};
	
}

//when not playing music, make sure the scene works
function origin_animate() {
	requestAnimationFrame(origin_animate);

	//drawWave();

	renderer.render(scene, camera);
}

//turning faces to right
function spinning_right() {
	//requestAnimationFrame(spinning);
	if(offset < Math.PI / 2)
	{
	//count++;
		offset += Math.PI / 16;
		outerMesh.rotation.y += Math.PI / 16;
		innerMesh.rotation.y -= Math.PI / 16;
		requestAnimationFrame(spinning_right);
	//console.log(count);
	}

	//console.log(dataArray);
}

//turning faces to up
function spinning_up() {
	//requestAnimationFrame(spinning);
	if(offset < Math.PI / 2)
	{
	//count++;
		offset += Math.PI / 16;
		outerMesh.rotation.x -= Math.PI / 16;
		innerMesh.rotation.x += Math.PI / 16;
		requestAnimationFrame(spinning_up);
	//console.log(count);
	}
}

//turning faces to left
function spinning_left() {
	//requestAnimationFrame(spinning);
	if(offset < Math.PI / 2)
	{
	//count++;
		offset += Math.PI / 16;
		outerMesh.rotation.y -= Math.PI / 16;
		innerMesh.rotation.y += Math.PI / 16;
		requestAnimationFrame(spinning_left);
	//console.log(count);
	}
}

//turning faces to down
function spinning_down() {
	//requestAnimationFrame(spinning);
	if(offset < Math.PI / 2)
	{
	//count++;
		offset += Math.PI / 16;
		outerMesh.rotation.x += Math.PI / 16;
		innerMesh.rotation.x -= Math.PI / 16;
		requestAnimationFrame(spinning_down);
	//console.log(count);
	}
}
	

