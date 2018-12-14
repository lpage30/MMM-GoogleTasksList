# MMM-GoogleTasksList
Module for the [MagicMirror²](https://github.com/MichMich/MagicMirror/) smart mirror.

Displays tasks from Google Tasks App in a simple list 
Implementation is based on:
* [MMM-GoogleTasks](https://github.com/jgauth/MMM-GoogleTasks)

### Example
![Example of MMM-GoogleTasksList with just read-only auth token](images/rosample.png?raw=true "Example read-only token screenshot")
![Example of MMM-GoogleTasksList with just read-write auth token](images/rwsample.png?raw=true "Example read-write token screenshot")

### Dependencies
The [Google Node.js client library](https://www.npmjs.com/package/googleapis)


## Installation
To install the module, use your terminal to:
1. Navigate to your MagicMirror's modules folder. If you are using the default installation directory, use the command:<br />`cd ~/MagicMirror/modules`
2. Clone the module:<br />`git clone https://github.com/lpage30/MMM-GoogleTasksList.git`
3. Navigate to your module directory:<br />`cd ~/MagicMirror/modules/MMM-GoogleTasksList`
4. install the cloned module: `npm install`

## Authentication Setup
Google Tasks API an authenticated OAuth2 client:
1. Go [here](https://developers.google.com/tasks/quickstart/nodejs), and click "Enable the Google Tasks API" button. Follow the steps to download the credentials.json file. 
2. copy credentials.json to your MagicMirror config directory (MagicMirror/config). Rename it if you are using more than 1 set of credentials.
3. [Enable Google Tasks API](https://console.cloud.google.com/apis/library/tasks.googleapis.com). Select the same project as in step 1.
4. Run CreateTokens.js:<br />`node CreateTokens.js`
5. Follow the instructions. Copy the resulting Token.json files (RO and RW) to your MagicMirror config directory (MagicMirror/config). Rename them if you are using more than 1 set.

## Using the module

### Google Task definitions for backlog, in progress, and done.
* Backlog: A Task that is NOT completed and does NOT have a due date
* In Progress: A Task that is NOT completed but DOES HAVE a due date
* Done: Any Task that is completed

### MagicMirror² Configuration

To use this module, add the following configuration block to the modules array in the `config/config.js` file:
```js
var config = {
    modules: [
        ...
        {
			module: 'MMM-GoogleTasksList',
			position: 'top_left',
			config: {
				listName: 'To-Do',
				credentialsRelativeFilepath: './credentials.json',
				roTokenRelativeFilepath: './rotoken.json',
				rwTokenRelativeFilepath: './rwtoken.json',
			}
		},
        ...
    ]
}
```

### Configuration Options

| Option                  | Details
|------------------------ |--------------
| `listID` or `listName`  | *Required* - List ID or Name from your Google Tasks application
| `updateInterval`        | *Optional* - Interval at which content updates (Milliseconds) <br><br> **Possible values:** `2000` - `86400000` (Tasks API has default maximum of 50,000 calls per day.) <br> **Default value:** `0` (No update)
| `animationSpeed`        | *Optional* - Speed of the update animation. (Milliseconds) <br><br> **Possible values:** `0` - `5000` <br> **Default value:** `0` (No Animation)
| `showCompleted`         | *Optional* - Show completed task items <br><br> **Possible values:** `true`  `false` <br> **Default value:** `false`
| `credentialsRelativeFilepath`  | *Required* - Filepath relative to `MagicMirror/config` directory for the credentials used by this instance.
| `roTokenRelativeFilepath` or `rwTokenRelativeFilepath`  | *Required* - Filepath relative to `MagicMirror/config` directory for the tokens used by this instance. If rw is provided than that token will be used exclusively and enable moving of tasks to in progress or completed or backlog.

