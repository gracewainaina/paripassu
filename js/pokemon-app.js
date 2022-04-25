const MAP_SIZE = 500
const NU_CENTER = ol.proj.fromLonLat([-87.6753, 42.056])

// downtown center, uncomment to use downtown instead, or make your own
// const NU_CENTER = ol.proj.fromLonLat([-87.6813, 42.049])
const AUTOMOVE_SPEED = 1
const UPDATE_RATE = 100

//add a const to track your checkpoints/unlocked landmarks
/*
 Apps are made out of a header (title/controls) and footer
 and some number of columns
 If its vertical, the columns can become sections in one column
 */


let landmarkCount = 0

let gameState = {
	points: 0,
	captured: [],
	messages: [],
	ticks: 0,
	pointRate: 1,
	healthPoints: 150,
	maxHealthPoints: 300,
	gameOver: false,
}

let badPlaces = [
	ol.proj.fromLonLat([-87.6715, 42.055]),
	ol.proj.fromLonLat([-87.6745, 42.052]),
	ol.proj.fromLonLat([-87.6745, 42.059]),
	ol.proj.fromLonLat([-87.6763, 42.056])
]

function isBad(location) {
	for (let badPlace of badPlaces) {
		if (badPlace[0]-100 <= location[0] &&
			location[0] <= badPlace[0]+100 &&
			badPlace[1]-100 <= location[1] &&
			location[1] <= badPlace[1]+100)
			return true;
	}
	return false;
}

// Create an interactive map
// Change any of these functions

let map = new InteractiveMap({
	mapCenter: NU_CENTER,

	// Ranges
	ranges: [500, 200, 90, 1], // must be in reverse order

	initializeMap() {
		// A good place to load landmarks
		// this.loadLandmarks("landmarks-natural-evanston", (landmark) => {
		// 	// Keep this landmark?

		// 	// Keep all landmarks in the set
		// 	return true

		// 	// Only keep this landmark if its a store or amenity, e.g.
		// 	// return landmark.properties.amenity || landmark.properties.store
		// })

		// Create random landmarks (theses are dummy vars)
		// You can also use this to create trails or clusters for the user to find
		for (var i = 0; i < 10; i++) {

			// make a polar offset (radius, theta) 
			// from the map's center (units are *approximately* meters)
			let position = clonePolarOffset(NU_CENTER, 400*Math.random() + 300, 20*Math.random())
			this.createLandmark({
				pos: position,
				name: words.getRandomWord(),
				points: isBad(position) ? Math.floor(Math.random()*-10 - 1) : 1, // flat subtract from points if -, add to rate if +
			})
		}
	},

	update() {
		// Do something each frame
		//does the update of how many points you have unlocked go here?
		gameState.ticks += 1;
		if (gameState.ticks % 10 === 0){
			if (!gameState.gameOver)
				gameState.points += gameState.pointRate;

			// player has started exploring, begin decrementing health
			if(gameState.captured.length > 0 && gameState.healthPoints > 0){
				gameState.healthPoints -= 1
			}

			if (gameState.healthPoints === 0) 
				gameState.gameOver = true;

			// also decrement the landmarks down to zero over time
			// this.landmarks.forEach(landmark => {
			// 	if (landmark.points > 0){
			// 		landmark.points -= 1;
			// 	}
			// });
		}
	},

	initializeLandmark: (landmark, isPlayer) => {
		// Add data to any landmark when it's created

		// Any openmap data?
		if (landmark.openMapData) {
			console.log(landmark.openMapData)
			landmark.name = landmark.openMapData.name
		}
		
		// *You* decide how to create a marker
		// These aren't used, but could be examples
		// landmark.idNumber = landmarkCount++

		// this is used in featureToStyle return type.
		// previously, the color was made to represent the points, but we want that hidden.
		landmark.color = [Math.random(), 1, .5]

		return landmark
	}, 

	onEnterRange: (landmark, newLevel, oldLevel, dist) => {
		// What happens when the user enters a range
		// -1 is not in any range

		console.log("enter", landmark.name, newLevel)
		if (newLevel == 2) {
			if (landmark.points <= 0) {
				
				// Have we captured this?
				if (!gameState.captured.includes(landmark.name)) {
					gameState.points += landmark.points
					gameState.captured.push(landmark.name)
					// Add a message
					gameState.messages.push(`Points decreased! You captured ${landmark.name} and lost ${landmark.points} points`)
				}
			}
			else {
				if (!gameState.captured.includes(landmark.name)) {
					gameState.pointRate += landmark.points;
					gameState.captured.push(landmark.name)
					gameState.messages.push(`You captured ${landmark.name} for +${landmark.points} in point rate`)
				}
			}
			landmark.color = [0, 0, .5]
		}
	},

	onExitRange: (landmark, newLevel, oldLevel, dist) => {
		// What happens when the user EXITS a range around a landmark 
		// e.g. (2->1, 0->-1)
		//maybe delete landmark on exit, add new landmark
		console.log("exit", landmark.name, newLevel)
		// if (newLevel == 2) {
			// map.removeLandmark(landmark) 
			// let position = clonePolarOffset(NU_CENTER, 400*Math.random() + 300, 20*Math.random())
			// map.createLandmark({
			// 	pos: position,
			// 	name: words.getRandomWord(),
			// 	points: isBad(position) ? Math.floor(Math.random()*-10 - 1) : 1, // flat subtract from points if -, add to rate if +
			// })
		// }
		
	},
	
	
	featureToStyle: (landmark) => {
		// How should we draw this landmark?
		// Returns an object used to set up the drawing

		if (landmark.isPlayer) {
			return {
				icon: "person_pin_circle",
				noBG: true // skip the background
			}
		}
		
		// Pick out a hue, we can reuse it for foreground and background
		let hue = landmark.points*.1
		return {
			label: landmark.name + "\n" + landmark.distanceToPlayer +"m",
			fontSize: 8,

			// Icons (in icon folder)
			icon: "person_pin_circle",

			// Colors are in HSL (hue, saturation, lightness)
			iconColor: landmark.color,
			bgColor: [0,0,0],
			noBG: false // skip the background
		}
	},

	
})



window.onload = (event) => {
	const app = new Vue({
		template: `
		<div id="app">
		<header></header>
			<div id="main-columns">

				<div class="main-column" style="flex:1;overflow:scroll;max-height:1000px">
					<h2>Kaptcha</h2>
					<br>
					<h2 v-if="gameState.gameOver">GAME OVER</h2>

					<div>
						<h4>Health: {{gameState.healthPoints}}/{{gameState.maxHealthPoints}}</h4>
						<h4>Points: {{gameState.points}} ({{gameState.pointRate}} point(s) per sec)</h4>
						<h4>Messages</h4>
						<p>{{gameState.messages}}</p>
						<h3>Captured Landmarks</h3>
						<p>{{gameState.captured}}</p>
					</div>
					
				</div>
				
				<div style="display: flex; flex-direction: column;">
					<button v-on:click="heal" style="margin: 5px;">Get more health! (30 points)</button>
					<button v-on:click="buyLandmark" style="margin: 5px;">Get more landmarks! (30 points)</button>
					<button v-on:click="restart" style="margin: 5px;">Restart</button>
				</div>

				<div class="main-column" style="overflow:hidden;width:${MAP_SIZE}px;height:${MAP_SIZE}px">
					<location-widget :map="map" />
				
				</div>

			</div>	
		<footer></footer>
		</div>`,

		data() {
			return {
			
				map: map,
				gameState: gameState
			}
		},

		methods: {
			heal: function(event){
				if (gameState.points >= 30){
					gameState.points += -30;
					gameState.healthPoints = Math.min(300, gameState.healthPoints + 60);
				}
			},

			buyLandmark: function(event){
				if(gameState.points >= 30){
					gameState.points += -30;
					let position = clonePolarOffset(NU_CENTER, 400*Math.random() + 300, 20*Math.random())
					map.createLandmark({
						pos: position,
						name: words.getRandomWord(),
						points: isBad(position) ? Math.floor(Math.random()*-10 - 1) : 1, // flat subtract from points if -, add to rate if +
					})
				}
			},

			endGame: function(event) {
				if (gameState.healthPoints === 0) {
					gameState = "Gameover";
				}
			},

			restart: function(event){
				window.location.reload();
			}
		},

		// Get all of the intarsia components, plus various others
		components: Object.assign({
			// "user-widget": userWidget,
			// "room-widget": roomWidget,
			"location-widget": locationWidget,
		}),

		el: "#app"
	})

};

