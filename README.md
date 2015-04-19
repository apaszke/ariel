#ariel
**ariel** is a restricted Boltzmann machine based neural network which can be taught how to play music.

##Input/Output:
ariel uses parsed MIDI tracks as input and returns a fully legal MIDI track that can be loaded to any MIDI player.

##Neural network:
The implementation of the neural network is strongly based on the `dnn` [library for node.js][1] with a handful of additional hacks and tricks.



[1]: https://github.com/junku901/dnn/tree/8ea7abadc2bdb1d5047ada841196e7e0e35c3fe9
