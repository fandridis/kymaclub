import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Modal,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  ActivityIndicator
} from 'react-native';
import { XIcon } from 'lucide-react-native';
import { StarRating } from './StarRating';
import { useSubmitReview } from '../hooks/useSubmitReview';
import type { Id } from '@repo/api/convex/_generated/dataModel';
import { theme } from '../theme';

interface WriteReviewModalProps {
  isVisible: boolean;
  onClose: () => void;
  venueId: Id<"venues">;
  venueName: string;
  onReviewSubmitted?: () => void;
}

export const WriteReviewModal: React.FC<WriteReviewModalProps> = ({
  isVisible,
  onClose,
  venueId,
  venueName,
  onReviewSubmitted
}) => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const { submitReview, isSubmitting } = useSubmitReview();

  const handleSubmit = async () => {
    if (rating === 0) {
      Alert.alert('Rating Required', 'Please select a star rating before submitting your review.');
      return;
    }

    const result = await submitReview({
      venueId,
      rating,
      comment: comment.trim() || undefined
    });

    if (result.success) {
      Alert.alert(
        'Review Submitted',
        'Thank you for your review!',
        [
          {
            text: 'OK',
            onPress: () => {
              setRating(0);
              setComment('');
              onReviewSubmitted?.();
              onClose();
            }
          }
        ]
      );
    } else {
      Alert.alert('Error', result.error || 'Failed to submit review. Please try again.');
    }
  };

  const handleClose = () => {
    if (rating > 0 || comment.trim()) {
      Alert.alert(
        'Discard Review?',
        'You have unsaved changes. Are you sure you want to close?',
        [
          { text: 'Continue Writing', style: 'cancel' },
          { 
            text: 'Discard', 
            style: 'destructive',
            onPress: () => {
              setRating(0);
              setComment('');
              onClose();
            }
          }
        ]
      );
    } else {
      onClose();
    }
  };

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView 
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft} />
          <Text style={styles.headerTitle}>Write Review</Text>
          <TouchableOpacity
            onPress={handleClose}
            style={styles.closeButton}
          >
            <XIcon size={24} color={theme.colors.zinc[600]} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Venue Info */}
          <View style={styles.venueInfo}>
            <Text style={styles.venueLabel}>Reviewing</Text>
            <Text style={styles.venueName}>{venueName}</Text>
          </View>

          {/* Rating Section */}
          <View style={styles.ratingSection}>
            <Text style={styles.sectionTitle}>How would you rate your experience?</Text>
            <View style={styles.ratingContainer}>
              <StarRating
                rating={rating}
                onRatingChange={setRating}
                interactive
                size={40}
              />
            </View>
          </View>

          {/* Comment Section */}
          <View style={styles.commentSection}>
            <Text style={styles.sectionTitle}>Tell us about your experience (optional)</Text>
            <TextInput
              style={styles.commentInput}
              multiline
              numberOfLines={6}
              maxLength={750}
              placeholder="What did you like about this venue? What could be improved?"
              placeholderTextColor={theme.colors.zinc[400]}
              value={comment}
              onChangeText={setComment}
              textAlignVertical="top"
            />
            <Text style={styles.characterCount}>
              {comment.length}/750
            </Text>
          </View>

          {/* Guidelines */}
          <View style={styles.guidelines}>
            <Text style={styles.guidelinesTitle}>Review Guidelines</Text>
            <Text style={styles.guidelinesText}>
              • Be honest and helpful to other users{'\n'}
              • Focus on your experience at the venue{'\n'}
              • Keep it respectful and constructive{'\n'}
              • Avoid personal attacks or inappropriate content
            </Text>
          </View>
        </ScrollView>

        {/* Submit Button at Bottom */}
        <View style={styles.bottomContainer}>
          <TouchableOpacity
            onPress={handleSubmit}
            style={[styles.submitButton, (rating === 0 || isSubmitting) && styles.submitButtonDisabled]}
            disabled={rating === 0 || isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <Text style={styles.submitButtonText}>Submit Review</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.zinc[50],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.zinc[100],
  },
  headerLeft: {
    width: 40,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.zinc[100],
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.zinc[900],
  },
  bottomContainer: {
    padding: 20,
    paddingBottom: 40, // Extra padding for safe area
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: theme.colors.zinc[100],
  },
  submitButton: {
    backgroundColor: theme.colors.zinc[900],
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  submitButtonDisabled: {
    backgroundColor: theme.colors.zinc[300],
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  venueInfo: {
    alignItems: 'center',
    marginBottom: 32,
  },
  venueLabel: {
    fontSize: 14,
    color: theme.colors.zinc[500],
    marginBottom: 4,
  },
  venueName: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.zinc[900],
  },
  ratingSection: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.zinc[900],
    marginBottom: 16,
  },
  ratingContainer: {
    alignItems: 'flex-start',
  },
  commentSection: {
    marginBottom: 32,
  },
  commentInput: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: theme.colors.zinc[200],
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    minHeight: 120,
    color: theme.colors.zinc[900],
  },
  characterCount: {
    textAlign: 'right',
    fontSize: 12,
    color: theme.colors.zinc[500],
    marginTop: 8,
  },
  guidelines: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.zinc[100],
  },
  guidelinesTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.zinc[900],
    marginBottom: 8,
  },
  guidelinesText: {
    fontSize: 13,
    color: theme.colors.zinc[600],
    lineHeight: 18,
  },
});