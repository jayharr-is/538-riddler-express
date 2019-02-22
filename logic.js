
		let assertionList = [
			{id: 0, author: "a", target: "b", relationship: ">", number: 20},
			{id: 1, author: "b", target: "c", relationship: ">", number: 18},
			{id: 2, author: "c", target: "d", relationship: "<", number: 22},
			{id: 3, author: "d", target: "e", relationship: "!=", number: 17},
			{id: 4, author: "e", target: "a", relationship: ">", number: 21},
			{id: 5, author: "a", target: "d", relationship: ">", number: 16},
			{id: 6, author: "b", target: "e", relationship: "<", number: 20},
			{id: 7, author: "c", target: "a", relationship: "==", number: 19},
			{id: 8, author: "d", target: "b", relationship: "==", number: 20},
			{id: 9, author: "e", target: "c", relationship: "<", number: 18}
		]
		let islanderList = ["a","b","c","d","e"]

		const processAssertion = {
			"==": (a,t) => {
				if(t.age != null && t.age != a.number){
					return true
				} else if(t.notAge.indexOf(a.number) != -1){
					return true
				} else if(t.getMinAge() > a.number || t.getMaxAge() < a.number){
					return true
				} else {
					t.age = a.number
				}
			},
			"<": (a,t) => {
				if(t.age != null && t.age >= a.number){
					return true
				} else if(t.getMinAge() >= a.number){
					return true
				} else {
					t.maxAge = Math.min(a.number - 1, t.maxAge)
				}
			},
			">": (a,t) => {
				if(t.age != null && t.age <= a.number){
					return true
				} else if(t.getMaxAge() <= a.number){
					return true
				} else {
					t.minAge = Math.max(a.number + 1, t.minAge)
				}
			},
			"!=": (a,t) => {
				if(t.age != null && t.age == a.number){
					return true
				} else if(t.getMinAge() == a.number && t.getMaxAge() == a.number){
					return true
				} else {
					t.notAge.push(a.number)
				}
			}
		}

		//lMin and lMax will represent the range of all knowable values of L
		let numbers = assertionList.map(x => x.number)
		let lMin = Math.min.apply(null, numbers) - 4
		let lMax = Math.max.apply(null, numbers) + 4		
		
		class Islander {
			constructor(key, L, lMax, lMin){
				this.id = key
				this.L = L
				this.lMax = this.maxAge = lMax;
				this.lMin = this.minAge = lMin;
				this.age = null;
				this.notAge = []			
			}
			getMinAge(){
				let currentMin = this.minAge;
				let continuousRun = true
				for(let i = currentMin; i <= this.lMax && continuousRun; i++){
					if(this.notAge.indexOf(i) != -1){
						currentMin = i;
					} else {
						continuousRun = false;
					}
				}
				return currentMin
			}
			getMaxAge(){
				let currentMax = this.maxAge;
				let continuousRun = true
				for(let i = currentMax; i >= this.lMin && continuousRun; i--){
					if(this.notAge.indexOf(i) != -1){
						currentMax = i;
					} else {
						continuousRun = false;
					}
				}
				return currentMax
			}
			isTrustworthy(){
				if(this.getMaxAge() < this.L || (this.age != null && this.age < this.L)){
					return true;
				}
				if(this.getMinAge() >= this.L || (this.age != null && this.age >= this.L)){
					return false;
				}
				return null;
			}
			getTrustedUnprocessedAssertions(assertions){
				let _this = this
				let isTrustworth = this.isTrustworthy();
				if(isTrustworth == null) { return []; }

				return assertions
					.filter(x => x.author == this.id)
					.filter(x => !x.processed)
					.slice(0)
					.map(x => _this.isTrustworthy() ? x : _this.reverseAssertion(x));
			}
			reverseAssertion(assertion){
				let newAssertion = {
					id: assertion.id,
					author: assertion.author, 
					target: assertion.target, 
					relationship: assertion.relationship, 
					number: assertion.number,
					processed: assertion.processed
				}
				switch(newAssertion.relationship){
					case "==": newAssertion.relationship = "!="; break;
					case "!=": newAssertion.relationship = "=="; break;
					case ">": newAssertion.relationship = "<"; newAssertion.number++; break;
					case "<": newAssertion.relationship = ">"; newAssertion.number--; break;
				}
				return newAssertion
			}		
		}

		let logging = false

		//Loop through the possible values of L
		for(let L = lMin + 1; L <= lMax - 1; L++){
			let solutionFound = false;
			//Loop through each islander, assuming that this one is telling the truth.
			for(let i = 0; i < islanderList.length; i++){
				let assertions = assertionList.slice(0);
				assertions.forEach(x => x.processed = false)

				let islanders = {}
				islanderList.forEach(key => islanders[key] = new Islander(key, L, lMax, lMin))
			
				let trustedIslander = islanderList[i]
				islanders[trustedIslander].maxAge = L - 1;

				let conflictsFound = false;
				function processIslanders(){

					//Get an array of objects reprenting trusted, unprocessed assertions from islanders
					let trustedAssertions = 
						Object.values(islanders)
							.map(x => x.getTrustedUnprocessedAssertions(assertions))
							.flat()
							.filter(x => x)
							.filter(x => !x.processed);
					if(trustedAssertions.length && !conflictsFound){
						trustedAssertions.forEach((assertion,i) => {
							let target = islanders[assertion.target]
							
							//Process the assertion
							let result = processAssertion[assertion.relationship](assertion, target)
							conflictsFound = conflictsFound || result

							//Set the original assertion to processed
							assertions.filter(x => x.id == assertion.id)[0].processed = true
						})
						processIslanders()
					} else {
						let knownIslanders = Object.values(islanders).filter(x => x.isTrustworthy() != null).length						
						if(!conflictsFound && knownIslanders == islanderList.length && !solutionFound){
							solutionFound = true
							console.log("-----------");								
							console.log("POSSIBLE ANSWER: ");								
							console.log("-----------");								
							console.log("L is: " + L)
							console.log("Honest islanders: " + Object.values(islanders).filter(x => x.isTrustworthy()).map(x => x.id).join(", "))
							console.log("Lying islanders: " + Object.values(islanders).filter(x => !x.isTrustworthy()).map(x => x.id).join(", "))
						}						
					}
				}
				processIslanders();
			}
		}
