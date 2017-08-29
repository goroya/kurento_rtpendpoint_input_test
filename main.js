require('date-utils');
const fs = require('fs');
const path = require('path');
const minimist = require('minimist');
const kurento = require('kurento-client');

const debugFlag = false;

const dt = new Date();
const nowTime = dt.toFormat('YYYYMMDD_HH24MISS');
const argv = minimist(process.argv.slice(2), {
    default: {
        ws_uri: 'ws://192.168.7.119:8888/kurento',
        file_uri: `file:///tmp/recorder_demo_${nowTime}.webm`,
        video_file: 'file:///home/test/Desktop/nodeKurentoRtpEP/output.mp4',
    },
});

const fromSdp = fs.readFileSync(path.join(__dirname, 'from.sdp'), 'utf-8');
console.log(fromSdp);

(async () => {
    console.log('Start');
    try {
        // Create Kurento Crient
        const {['_']: kurentoClient} = await new Promise((resolve, reject) => {
            kurento(argv.ws_uri, (error, _kurentoClient) => {
                if (error) {
                    reject({msg: 'kurentoClient connect Fail', error});
                }
                // There is no resolve in this code. Why?
                // resolve(_kurentoClient);
                resolve({_: _kurentoClient});
            });
        });
        console.log('kurentoClient Created');

        // Create Pipline
        const {['_']: pipeline} = await new Promise((resolve, reject) => {
            kurentoClient.create('MediaPipeline', (error, _pipeline) => {
                if (error) {
                    reject({msg: 'MediaPipeline create Fail', error});
                }
                // There is no resolve in this code. Why?
                // resolve(_pipeline);
                resolve({_: _pipeline});
            });
        });
        console.log('pipeline Created');

        // Create RtpEndpoint
        const {['_']: RtpEndpoint} = await new Promise(
            (resolve, reject) => {
                pipeline.create('RtpEndpoint', (error, _rtpEndpoint) => {
                        if (error) {
                            reject({
                                msg: 'RtpEndpointForPlayer create Fail',
                                error}
                            );
                        }
                        resolve({_: _rtpEndpoint});
                    }
                );
            }
        );
        addEventRtpEp(RtpEndpoint, 'RTP Player');
        console.log('RtpEndpoint Created');

        // Create RecorderEndpoint
        const {['_']: RecorderEndpoint} = await new Promise(
            (resolve, reject) => {
                pipeline.create('RecorderEndpoint', {uri: argv.file_uri},
                    (error, _rtpEndpoint) => {
                        if (error) {
                            reject({msg: 'rtpEndpointTo create Fail', error});
                        }
                        resolve({_: _rtpEndpoint});
                    }
                );
            }
        );
        function recordStop() {
            RecorderEndpoint.stop();
            console.log('rtpEndpointFrom Record Stop');
        }
        function commonEnd() {
            pipeline.release();
            console.log('Pipeline release');
        }
        process.on('beforeExit', () => {
            recordStop();
            commonEnd();
        });
        process.on('exit', (code) => {
            recordStop();
            commonEnd();
        });
        process.on('SIGINT', function() {
            process.exit();
        });
        console.log('RecorderEndpoint Created');

        if (debugFlag !== true) {
            // Connect RtpEndpoint ->  RecorderEndpointForPlayer
            await new Promise((resolve, reject) => {
                RtpEndpoint.connect(RecorderEndpoint, (error) => {
                    if (error) {
                        reject({
                            msg: 'RtpEndpoint connect RecorderEndpoint Connect Fail',
                            error,
                        });
                    }
                    resolve();
                });
            });
            console.log('RtpEndpoint connect RecorderEndpoint Connected');
        }

        /*
        // RtpEndpointForPlayer generate SDP
        const answerSdp = await new Promise((resolve, reject) => {
            RtpEndpoint.processOffer(
                fromSdp, (error, answer) => {
                    if (error) {
                        reject({
                            msg: 'RtpEndpoint processOffer() Fail',
                            error,
                        });
                    }
                    resolve(answer);
                }
            );
        });
        fs.writeFileSync('./to.sdp', answerSdp);
        // Load Answer
        console.log('RtpEndpoint processOffer()');
        */

        // RecorderEndpoint recorder()
        await new Promise((resolve, reject) => {
            RecorderEndpoint.record((error) => {
                if (error) {
                    reject({
                        msg: 'rtpEndpointFrom Record Fail',
                        error,
                    });
                }
                resolve();
            });
        });
        console.log('RecorderEndpoint Record Start');

        if (debugFlag === true) {
            // -------------------------------------------------------------
            // Create PlayerEndpoint
            const {['_']: playerEndpoint} = await new Promise((resolve, reject) => {
                pipeline.create(
                    'PlayerEndpoint',
                    {uri: argv.video_file},
                    (error, _playerEndpoint) => {
                        if (error) {
                            reject({
                                msg: 'PlayerEndpoint create Fail',
                                error,
                            });
                        }
                        resolve({_: _playerEndpoint});
                    }
                );
            });
            playerEndpoint.on('EndOfStream', (event) => {
                console.log('playerEndpoint : -> EndOfStream', event);
                recordStop();
            });
            console.log('playerEndpoint Created');

            // PlayerEndpoint play()
            await new Promise((resolve, reject) => {
                playerEndpoint.play((error) => {
                    if (error) {
                        reject({
                            msg: 'playerEndpoint play() Fail',
                            error,
                        });
                    }
                    resolve();
                });
            });
            console.log('playerEndpoint Play OK');

            // Connect PlayerEndpoint ->  RecorderEndpointForPlayer
            await new Promise((resolve, reject) => {
                playerEndpoint.connect(RecorderEndpoint, (error) => {
                    if (error) {
                        reject({
                            msg: 'PlayerEndpoint -> RecorderEndpoint Connect Fail',
                            error,
                        });
                    }
                    resolve();
                });
            });
            console.log('playerEndpoint -> RecorderEndpoint Connected');
        }
    } catch (err) {
        console.log('catch error', err);
    }
    function addEventRtpEp(rtpEp, label) {
        rtpEp.on('ConnectionStateChanged', (State) => {
            console.log(
                label + ': -> ConnectionStateChanged ' + State.oldState + ' -> ' + State.newState
            );
        });
        rtpEp.on('ElementConnected', (response) => {
            console.log(label + ': -> ElementConnected' );
        });
        rtpEp.on('ElementDisconnected', (sink, mediaType, srcMDesc, sinkMDesc) => {
            console.log(label + ': -> ElementDisconnected' );
            console.log(label + ': srcMDesc   ' + srcMDesc);
            console.log(label + ': sinkMDesc  ' + sinkMDesc);
        });
        rtpEp.on('Error', function(response) {
            console.log(label + ': -> Error' );
        });
        // rtpEp.on('Media', function(response) {
        //     console.log(label + ': -> ' );
        // });
        rtpEp.on('MediaFlowInStateChange', function(response) {
            console.log(label + ': -> MediaFlowInStateChange' );
        });
        rtpEp.on('MediaFlowOutStateChange', function(response) {
            console.log(label + ': -> MediaFlowOutStateChange' );
        });
        rtpEp.on('MediaSessionStarted', function(response) {
            console.log(label + ': -> MediaSessionStarted' );
        });
        rtpEp.on('MediaSessionTerminated', function(response) {
            console.log(label + ': -> MediaSessionTerminated' );
        });
        rtpEp.on('MediaStateChanged', function(response) {
            console.log(label + ': -> MediaStateChanged' );
        });
        // rtpEp.on('ObjectCreated', function(response) {
        //     console.log(label + ': -> ' );
        // });
        // rtpEp.on('ObjectDestroyed', function(response) {
        //     console.log(label + ': -> ' );
        // });
        // rtpEp.on('RaiseBase', function(response) {
        //     console.log(label + ': -> ' );
        // });
        // rtpEp.on('UriEndpointStateChanged', function(response) {
        //     console.log(label + ': -> ' );
        // });
    }
    console.log('End');
})();
