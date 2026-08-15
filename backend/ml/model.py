# backend/ml/model.py
import numpy as np
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import LSTM, Dense, Dropout

def build_prediction_model():
    model = Sequential([
        LSTM(64, return_sequences=True, input_shape=(10, 5)),  # 10 time steps, 5 features
        Dropout(0.2),
        LSTM(32),
        Dropout(0.2),
        Dense(1, activation='sigmoid')  # Output: crush likelihood (0-1)
    ])
    model.compile(optimizer='adam', loss='binary_crossentropy', metrics=['accuracy'])
    return model