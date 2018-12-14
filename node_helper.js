var NodeHelper = require('node_helper');
const { fetchTasks, putTask, deleteTask } = require('./googleTasksAPI');

const node_helper = {
    
    socketNotificationReceived: function (notification, payload) {
        const self = this;
        if (notification === 'GET_GOOGLE_TASKS') {
            fetchTasks(payload.identifier, payload.config, 
                function (config_payload) {
                    console.log(`SENDING: UPDATE_GOOGLE_TASKS_${payload.identifier} ${JSON.stringify(config_payload.config)} ${config_payload.tasks.length} Tasks`);
                    self.sendSocketNotification(`UPDATE_GOOGLE_TASKS_${payload.identifier}`, config_payload);
                },
                function (failureMessage) {
                    console.log(`SENDING: FAILED_GOOGLE_TASKS_${payload.identifier} ${failureMessage}`);
                    self.sendSocketNotification(`FAILED_GOOGLE_TASKS_${payload.identifier}`, failureMessage);
                }
            );
        }
        if (notification === 'PUT_GOOGLE_TASKS') {
            putTask(payload.identifier, payload.config, payload.item,
                function (successMessage) {
                    console.log(`SENDING: TRANSITIONED_GOOGLE_TASKS_${payload.identifier} ${successMessage}`);
                    self.sendSocketNotification(`TRANSITIONED_GOOGLE_TASKS_${payload.identifier}`, successMessage);
                },
                function (failureMessage) {
                    console.log(`SENDING: FAILED_GOOGLE_TASKS_${payload.identifier} ${failureMessage}`);
                    self.sendSocketNotification(`FAILED_GOOGLE_TASKS_${payload.identifier}`, failureMessage);
                }
            );
        }
        if (notification === 'DELETE_GOOGLE_TASKS') {
            deleteTask(payload.identifier, payload.config, payload.item,
                function (successMessage) {
                    console.log(`SENDING: TRANSITIONED_GOOGLE_TASKS_${payload.identifier} ${successMessage}`);
                    self.sendSocketNotification(`TRANSITIONED_GOOGLE_TASKS_${payload.identifier}`, successMessage);
                },
                function (failureMessage) {
                    console.log(`SENDING: FAILED_GOOGLE_TASKS_${payload.identifier} ${failureMessage}`);
                    self.sendSocketNotification(`FAILED_GOOGLE_TASKS_${payload.identifier}`, failureMessage);
                }
            );
        }
    }
};

module.exports = NodeHelper.create(node_helper);