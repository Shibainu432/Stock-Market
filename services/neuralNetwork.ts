// Activation functions and their derivatives
function tanh(x: number): number {
    return Math.tanh(x);
}

function dtanh(y: number): number {
    // y is already tanh(x), so the derivative is 1 - y^2
    return 1 - y * y;
}

// Helper for matrix operations
function createMatrix(rows: number, cols: number): number[][] {
    const matrix: number[][] = [];
    for (let i = 0; i < rows; i++) {
        matrix[i] = [];
        for (let j = 0; j < cols; j++) {
            // Initialize with small random weights to avoid saturation
            matrix[i][j] = (Math.random() * 2 - 1) * 0.1; 
        }
    }
    return matrix;
}

export class NeuralNetwork {
    layerSizes: number[];
    weights: number[][][]; // Array of weight matrices for each layer
    biases: number[][]; // Array of bias vectors for each layer
    inputNeuronNames: string[];

    constructor(layerSizes: number[], inputNeuronNames: string[] = []) {
        this.layerSizes = layerSizes;
        this.inputNeuronNames = inputNeuronNames;
        this.weights = [];
        this.biases = [];

        for (let i = 0; i < layerSizes.length - 1; i++) {
            const inputSize = layerSizes[i];
            const outputSize = layerSizes[i+1];
            this.weights.push(createMatrix(inputSize, outputSize));
            this.biases.push(new Array(outputSize).fill(0).map(() => (Math.random() * 2 - 1) * 0.1));
        }
    }

    feedForward(inputArray: number[]): number[] {
        let activations = [...inputArray];

        for (let i = 0; i < this.weights.length; i++) {
            const weightMatrix = this.weights[i];
            const biasVector = this.biases[i];
            const nextActivations: number[] = new Array(this.layerSizes[i+1]).fill(0);

            for (let j = 0; j < nextActivations.length; j++) { // For each output neuron
                let sum = 0;
                for (let k = 0; k < activations.length; k++) { // For each input neuron
                    sum += activations[k] * weightMatrix[k][j];
                }
                sum += biasVector[j];
                // Use tanh for hidden layers and a linear output for the final score
                nextActivations[j] = (i === this.weights.length - 1) ? sum : tanh(sum);
            }
            activations = nextActivations;
        }
        return activations;
    }

    backpropagate(inputArray: number[], targetArray: number[], learningRate: number) {
        // 1. Feed forward to get all layer activations
        const layerActivations: number[][] = [[...inputArray]];
        let currentActivations = [...inputArray];

        for (let i = 0; i < this.weights.length; i++) {
            const weightMatrix = this.weights[i];
            const biasVector = this.biases[i];
            const nextActivations = new Array(this.layerSizes[i + 1]).fill(0);

            for (let j = 0; j < nextActivations.length; j++) {
                let sum = 0;
                for (let k = 0; k < currentActivations.length; k++) {
                    sum += currentActivations[k] * weightMatrix[k][j];
                }
                sum += biasVector[j];
                nextActivations[j] = (i === this.weights.length - 1) ? sum : tanh(sum);
            }
            layerActivations.push(nextActivations);
            currentActivations = nextActivations;
        }

        // 2. Backpropagation from output to input
        let errors = targetArray.map((target, i) => target - layerActivations[layerActivations.length - 1][i]);

        for (let i = this.weights.length - 1; i >= 0; i--) {
            const prevActivations = layerActivations[i];
            const currentLayerOutputs = layerActivations[i+1];
            
            // Calculate gradients for the current layer
            const gradients = currentLayerOutputs.map((output, j) => {
                // The derivative for the linear output layer is 1
                const derivative = (i === this.weights.length - 1) ? 1 : dtanh(output);
                return errors[j] * derivative;
            });
            
            // Calculate errors for the previous (next in backward pass) layer
            const nextErrors = new Array(prevActivations.length).fill(0);
            for (let j = 0; j < prevActivations.length; j++) {
                let errorSum = 0;
                for (let k = 0; k < gradients.length; k++) {
                     errorSum += this.weights[i][j][k] * errors[k];
                }
                nextErrors[j] = errorSum;
            }
            
            // Update weights and biases for the current layer
            for (let j = 0; j < prevActivations.length; j++) { // Input neurons to this layer
                for (let k = 0; k < gradients.length; k++) { // Output neurons from this layer
                    this.weights[i][j][k] += gradients[k] * prevActivations[j] * learningRate;
                }
            }
            for (let j = 0; j < gradients.length; j++) {
                this.biases[i][j] += gradients[j] * learningRate;
            }

            errors = nextErrors;
        }
    }
    
    // For visualization purposes
    getInputLayerWeights(): Record<string, number> {
        if (this.inputNeuronNames.length === 0 || this.weights.length === 0) return {};
        const inputToH1Weights: Record<string, number> = {};
        const inputWeights = this.weights[0]; // Weights from input to first hidden layer
        this.inputNeuronNames.forEach((name, i) => {
            if (inputWeights[i]) {
                // Calculate average absolute weight as a measure of influence
                inputToH1Weights[name] = inputWeights[i].reduce((sum, w) => sum + Math.abs(w), 0) / inputWeights[i].length;
            }
        });
        return inputToH1Weights;
    }

    getOutputLayerWeights(): Record<string, number> {
        if (this.layerSizes.length < 2 || this.weights.length === 0) return {};
        const lastHiddenToOutputWeights: Record<string, number> = {};
        const lastHiddenLayerIndex = this.layerSizes.length - 2;
        const lastWeights = this.weights[this.weights.length - 1]; // Weights from last hidden layer to output
        
        for (let i = 0; i < lastWeights.length; i++) { // For each neuron in the last hidden layer
            lastHiddenToOutputWeights[`H${lastHiddenLayerIndex}_${i+1}`] = lastWeights[i][0]; // Assuming a single output neuron
        }
        return lastHiddenToOutputWeights;
    }
}
