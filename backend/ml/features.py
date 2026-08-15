# backend/ml/features.py
def extract_features(crowd_data):
    return {
        'density': crowd_data['people_count'] / crowd_data['area'],
        'flow_speed': crowd_data['avg_movement_speed'],
        'density_change_rate': (current_density - previous_density) / time_delta,
        'bottleneck_score': 1 / (exit_width / crowd_count),
        'panic_index': acceleration_variance / avg_speed
    }