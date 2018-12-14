const getRFC3339DateTime = (days) => {
	const RFC3339_Format = 'YYYY-MM-DDTHH:mm:ss.000Z';
	let result = moment();
	if (days) {
		result = result.add('days', days);
	}
	return result.format(RFC3339_Format);
};
const itemToItemForUpdate = (item) => ({
	id: item.id,
	title: item.title,
	status: item.status,
	completed: item.completed,
	due: item.due,
	updated: getRFC3339DateTime(),
});

Module.register("MMM-GoogleTasksList",{
	// Default module config.
	// Default module config.
	defaults: {

		listName: '', // List Name resolves to listID
		listID: '', // List ID resolves to list Name
		showCompleted: true,
		showHidden: false,
		updateInterval: 0, // Never
		animationSpeed: 0,
		credentialsRelativeFilepath: '',
		roTokenRelativeFilepath: '',
		rwTokenRelativeFilepath: '',

	},
	
	// Define required scripts
	getScripts: function () {
		return ["moment.js", "node_helper.js", "googleTasksAPI.js"];
	},

	// Define required scripts.
	getStyles: function () {
		return ["font-awesome.css", "MMM-GoogleTasksList.css"];
	},
	/* requestUpdate()
	* request a list content update
	*/
   requestUpdate: function () {
	    var self = this;
	    Log.log('REQUESTING UPDATE');
		this.sendSocketNotification('GET_GOOGLE_TASKS', { identifier: self.identifier, config: self.config });
   },
    /* scheduleUpdateRequestInterval()
     * Schedule visual update.
     */
    scheduleUpdateRequestInterval: function () {
        var self = this;
		if (self.config.updateInterval > 0) {
			setInterval(function () {
				if (self.pause) {
					return;
				}

				if (self.retry) {
					self.requestUpdate();
				}
			}, self.config.updateInterval);
		}
    },
	// Define start sequence
	start: function() {

		Log.log("Starting module: " + this.name);
		this.tasks = [];
		this.activeItem = 0;
		if (this.config.listName) {
			this.data.header = this.config.listName;
		}
		this.loaded = false;
		this.canUpdate = false;
        this.error = false;
        this.errorMessage = '';
        this.retry = true;
		this.requestUpdate();
		this.pause = false;
		this.scheduleUpdateRequestInterval();			
	},
	getHeader: function () {
		return this.config.listName || this.data.header;
	},
	socketNotificationReceived: function(notification, payload) {
		var self = this;
		const updateEvent = `UPDATE_GOOGLE_TASKS_${self.identifier}`;
		const failedEvent = `FAILED_GOOGLE_TASKS_${self.identifier}`;
		const transitionEvent = `TRANSITIONED_GOOGLE_TASKS_${self.identifier}`;

		if (notification === updateEvent) {
			self.config = Object.assign({}, self.config, payload.config || {});
			self.data.header = self.config.listName;
			if(self.config.rwTokenRelativeFilepath) {
				self.canUpdate = true;
			}
			self.tasks = payload.tasks;
			self.loaded = true;
			self.updateDom(self.config.animationSpeed);
		}
		if (notification === transitionEvent) {
			Log.log(payload);
			self.updateDom(self.config.animationSpeed);
		}
		if (notification === failedEvent) {
			self.error = true;
			self.loaded = false;
			self.errorMessage = payload;
			self.updateDom(self.config.animationSpeed);
		}
	},
	transitionItem: function (item, newStatus) {
		if (item.status === newStatus) {
			return;
		}
		var self = this;
		let method = undefined;
		if (newStatus == 'needsAction') {
			method = 'PUT';
			item.status = 'needsAction';
			item.due = undefined;
			item.completed = undefined;
		} 
		if (newStatus == 'completed') {
			method = 'PUT';
			item.status = 'completed';
			item.completed = getRFC3339DateTime();
		}
		if (newStatus === 'delete') {
			method = 'DELETE';
			const newTasks = [];
			self.tasks.forEach((aTask) => {
				if (aTask.id !== item.id) {
					newTasks.push(aTask);
				}
			});
			self.tasks = newTasks;
		}
		Log.log(`${method} TASK ${item.title}`);
		self.sendSocketNotification(`${method}_GOOGLE_TASKS`, { identifier: self.identifier, config: self.config, item: itemToItemForUpdate(item) });		
	},
	getDom: function() {
		var self = this;
		var wrapper = document.createElement('div');
		if (self.hidden) {
			return wrapper;
		}
		wrapper.className = 'container small';
		function toggleStatusOnClick(item) {
			return function () {
				self.transitionItem(item, item.status === 'completed' ? 'needsAction' : 'completed');
			};
		}
		const strikeout = (text) => `<strike>${text}</strike>`;
		if (self.loaded) {
            if (self.tasks.length === 0) {
                wrapper.innerHTML = 'EMPTY';
				wrapper.className ='small dimmed';
				return wrapper;
			}
			const childParentTransitionBorder = `1px solid #666`;
			self.tasks.forEach((item, index) => {
				const isChildParentTransition = item.parent && (index+1) < self.tasks.length && !self.tasks[index+1].parent;
				const isCompleted = item.status === 'completed';
				const checkOrCircle = `<i class="fa fa-${isCompleted ? 'check' : 'circle-thin'}" ></i>`;
				const parentOrChildClass = item.parent ? 'item child' : 'item title';
			
				const titleWrapper = document.createElement('div');
				titleWrapper.className = parentOrChildClass;
				titleWrapper.innerHTML = `${checkOrCircle} ${isCompleted ? strikeout(item.title) : item.title}`;
				if (self.canUpdate) {
					titleWrapper.onclick = toggleStatusOnClick(item);
				}
				if (item.notes) {
					const notes = item.notes.replace(/\n/g , '<br>');
					noteWrapper = document.createElement('div');
					noteWrapper.className = 'item notes light';
					noteWrapper.innerHTML = `${isCompleted ? strikeout(notes) : notes}`;
					titleWrapper.appendChild(noteWrapper);					
				}

				const dateWrapper = document.createElement('div');
				dateWrapper.className = "item date light";
				if (item.due) {
					dateWrapper.innerHTML = moment(item.due).utc().format('MMM Do');
					if (isChildParentTransition) dateWrapper.style.borderBottom = childParentTransitionBorder;
					wrapper.appendChild(dateWrapper);
				}
				if (isChildParentTransition) {
					titleWrapper.style.borderBottom = childParentTransitionBorder;
					dateWrapper.style.borderBottom = childParentTransitionBorder;
				}
				wrapper.appendChild(titleWrapper);
				wrapper.appendChild(dateWrapper);
			});
			return wrapper;
		}
		if (self.error) {
			wrapper.innerHTML = `ERROR: ${self.errorMessage}`;
			wrapper.className = "xsmall dimmed";
		} else {
			wrapper.innerHTML = "<span class='small fa fa-refresh fa-spin fa-fw'></span>";
			wrapper.className = "small dimmed";
		}
		return wrapper;
	}
});
