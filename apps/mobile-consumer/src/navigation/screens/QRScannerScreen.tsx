import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert, StyleSheet, ScrollView } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { X, RotateCcw } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';

type ModalState = 'scanning' | 'single-ticket' | 'multiple-tickets' | 'selected-ticket' | 'no-tickets';

interface Ticket {
  id: string;
  customerName: string;
  className: string;
  businessName: string;
  instructorName: string;
  classDate: string;
  time: string;
  status: 'confirmed' | 'waitlist';
}

export const QRScannerScreen: React.FC = () => {
  const navigation = useNavigation();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [modalState, setModalState] = useState<ModalState>('scanning');
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [venueInfo, setVenueInfo] = useState<{ businessId: string, venueId: string } | null>(null);

  useEffect(() => {
    setScanned(false);
    setModalState('scanning');
  }, []);

  const handleBarCodeScanned = async ({ data }: { data: string }) => {
    if (scanned) return;

    setScanned(true);

    try {
      // Parse QR code data
      const qrData = JSON.parse(data);

      // Check if it has the expected structure
      if (qrData.businessId && qrData.venueId) {
        setVenueInfo({ businessId: qrData.businessId, venueId: qrData.venueId });

        // Simulate API call to fetch bookings for this venue
        await fetchVenueBookings(qrData.businessId, qrData.venueId);

      } else {
        Alert.alert(
          'Invalid QR Code',
          'This QR code does not contain valid venue information.',
          [
            { text: 'Try Again', onPress: () => resetToScanning() },
            { text: 'Close', onPress: () => navigation.goBack() }
          ]
        );
      }
    } catch (error) {
      console.error('Failed to parse QR code:', error);
      Alert.alert(
        'Invalid QR Code',
        'Unable to read QR code data. Please try again.',
        [
          { text: 'Try Again', onPress: () => resetToScanning() },
          { text: 'Close', onPress: () => navigation.goBack() }
        ]
      );
    }
  };

  const fetchVenueBookings = async (businessId: string, venueId: string, isMultiple: boolean = false) => {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Mock response - replace with real API call
    const singleTicket: Ticket[] = [
      {
        id: '1',
        customerName: 'John Doe',
        className: 'Morning Yoga Flow',
        businessName: 'Zen Fitness Studio',
        instructorName: 'Sarah Johnson',
        classDate: 'Feb 21',
        time: '10:00 AM',
        status: 'confirmed'
      }
    ];

    const multipleTickets: Ticket[] = [
      {
        id: '1',
        customerName: 'John Doe',
        className: 'Morning Yoga Flow',
        businessName: 'Zen Fitness Studio',
        instructorName: 'Sarah Johnson',
        classDate: '12/15',
        time: '10:00 AM',
        status: 'confirmed'
      },
      {
        id: '2',
        customerName: 'Jane Smith',
        className: 'HIIT Training',
        businessName: 'Zen Fitness Studio',
        instructorName: 'Mike Wilson',
        classDate: '12/15',
        time: '2:00 PM',
        status: 'waitlist'
      }
    ];

    const mockTickets = isMultiple ? multipleTickets : singleTicket;
    setTickets(mockTickets);

    if (mockTickets.length === 0) {
      setModalState('no-tickets');
    } else if (mockTickets.length === 1) {
      setModalState('single-ticket');
    } else {
      setModalState('multiple-tickets');
    }
  };

  const resetToScanning = () => {
    setScanned(false);
    setModalState('scanning');
    setTickets([]);
    setSelectedTicket(null);
    setVenueInfo(null);
  };

  const handleTicketSelect = (ticket: Ticket) => {
    setSelectedTicket(ticket);
    setModalState('selected-ticket');
  };

  const goBackToTicketList = () => {
    setSelectedTicket(null);
    setModalState('multiple-tickets');
  };


  const handleRequestPermission = async () => {
    const { granted } = await requestPermission();
    if (!granted) {
      Alert.alert(
        'Camera Permission Required',
        'Please allow camera access to scan QR codes.',
        [{ text: 'OK' }]
      );
    }
  };

  if (permission === null) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Requesting Permission...</Text>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeButton}>
            <X color="#000" size={24} />
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <View style={styles.header}>
          <Text style={styles.title}>Camera Permission</Text>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeButton}>
            <X color="#000" size={24} />
          </TouchableOpacity>
        </View>

        <View style={styles.permissionContent}>
          <Text style={styles.message}>Camera permission is required to scan QR codes</Text>
          <TouchableOpacity style={styles.button} onPress={handleRequestPermission}>
            <Text style={styles.buttonText}>Grant Permission</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Test functions for simulator
  const testSingleSuccess = async () => {
    setScanned(true);
    setVenueInfo({ businessId: "test_business_123", venueId: "test_venue_456" });
    await fetchVenueBookings("test_business_123", "test_venue_456", false);
  };

  const testMultipleSuccess = async () => {
    setScanned(true);
    setVenueInfo({ businessId: "test_business_123", venueId: "test_venue_456" });
    await fetchVenueBookings("test_business_123", "test_venue_456", true);
  };

  const testFailedScan = async () => {
    setScanned(true);
    setVenueInfo({ businessId: "test_business", venueId: "test_venue" });

    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 500));

    setTickets([]);
    setModalState('no-tickets');
  };

  const renderScanningView = () => (
    <View style={styles.cameraContainer}>
      <CameraView
        style={styles.camera}
        onBarcodeScanned={handleBarCodeScanned}
        barcodeScannerSettings={{
          barcodeTypes: ['qr'],
        }}
      />

      <View style={styles.overlay}>
        <View style={styles.scanArea} />
        <Text style={styles.instruction}>Point camera at QR code</Text>

        {/* Test buttons for simulator */}
        <View style={styles.testButtonsContainer}>
          <TouchableOpacity
            style={styles.testButton}
            onPress={testSingleSuccess}
          >
            <Text style={styles.testButtonText}>Test Success</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.testButton, styles.testButtonMultiple]}
            onPress={testMultipleSuccess}
          >
            <Text style={styles.testButtonText}>Test Multiple</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.testButton, styles.testButtonFail]}
            onPress={testFailedScan}
          >
            <Text style={styles.testButtonText}>Test Fail</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const renderTicketCard = (ticket: Ticket, showBackButton: boolean = false) => {
    const handleConfirmByBusiness = () => {
      // Here you would make API call to confirm with business
      // For now, just close the modal
      navigation.goBack();
    };

    return (
      <View style={styles.singleTicketContainer}>
        {/* Main Ticket */}
        <View style={styles.ticketWrapper}>
          {/* Main Ticket Body */}
          <View style={styles.ticketMainBody}>
            {/* Ticket Header with Gradient */}
            <View style={styles.ticketHeader}>
              <Text style={styles.ticketHeaderTitle}>{ticket.className}</Text>
              <Text style={styles.businessName}>{ticket.businessName}</Text>
            </View>

            {/* Ticket Content */}
            <View style={styles.ticketContent}>
              {/* Venue & Instructor */}
              <View style={styles.venueSection}>
                <Text style={styles.dateTimeLabel}>Instructor</Text>
                <Text style={styles.instructorName}>{ticket.instructorName}</Text>
              </View>

              {/* Date & Time - Prominent */}
              <View style={styles.venueSection}>
                <Text style={styles.dateTimeLabel}>Date & Time</Text>
                <Text style={styles.instructorName}>{ticket.classDate} • {ticket.time}</Text>
              </View>

              {/* Attendee - Very Prominent */}
              <View style={styles.attendeeSection}>
                <Text style={styles.attendeeLabel}>ATTENDEE</Text>
                <Text style={styles.attendeeName}>{ticket.customerName}</Text>
              </View>

              {/* Status */}
              {/* <View style={styles.statusSection}>
                <View style={[
                  styles.statusBadge,
                  ticket.status === 'confirmed' ? styles.statusConfirmed : styles.statusWaitlist
                ]}>
                  <Text style={styles.statusText}>
                    {ticket.status === 'confirmed' ? 'CONFIRMED' : 'WAITLIST'}
                  </Text>
                </View>
              </View> */}
            </View>
          </View>

          {/* Perforated Edge Effect */}
          <View style={styles.perforatedEdge}>
            <View style={styles.dashedLine} />
            <View style={[styles.circularCutout, styles.leftCutout]} />
            <View style={[styles.circularCutout, styles.rightCutout]} />
          </View>

          {/* Ticket Stub */}
          <View style={styles.ticketStub}>
            <View style={styles.stubContent}>
              <View style={styles.stubLeft}>
                <Text style={styles.stubTitle}>{ticket.className}</Text>
                <Text style={styles.stubDateTime}>{ticket.classDate} • {ticket.time}</Text>
              </View>
              <View style={styles.stubRight}>
                <Text style={styles.stubName}>{ticket.customerName}</Text>
                <Text style={[
                  styles.stubStatus,
                  ticket.status === 'confirmed' ? styles.stubStatusConfirmed : styles.stubStatusWaitlist
                ]}>
                  {ticket.status === 'confirmed' ? 'CONFIRMED' : 'WAITLIST'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtonsContainer}>
          <TouchableOpacity
            style={styles.confirmButton}
            onPress={handleConfirmByBusiness}
          >
            <Text style={styles.confirmButtonText}>Confirm by Business</Text>
          </TouchableOpacity>

          <Text style={styles.confirmHelpText}>
            Let the studio see the booking and confirm its validity
          </Text>

          {showBackButton && (
            <TouchableOpacity style={styles.backButton} onPress={goBackToTicketList}>
              <Text style={styles.backButtonText}>← Back to Tickets</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  const renderSingleTicketView = () => {
    const ticket = tickets[0];
    if (!ticket) return null;
    return renderTicketCard(ticket, false);
  };

  const renderSelectedTicketView = () => {
    if (!selectedTicket) return null;
    return renderTicketCard(selectedTicket, true);
  };

  const renderMultipleTicketsView = () => (
    <View style={styles.resultsContainer}>
      <Text style={styles.resultsTitle}>Available Tickets</Text>
      <Text style={styles.resultsSubtitle}>Select your ticket for check-in</Text>

      <ScrollView style={styles.ticketsList}>
        {tickets.map((ticket) => (
          <TouchableOpacity
            key={ticket.id}
            style={styles.ticketItem}
            onPress={() => handleTicketSelect(ticket)}
          >
            <View style={styles.ticketInfo}>
              <Text style={styles.ticketCustomer}>{ticket.customerName}</Text>
              <Text style={styles.ticketClass}>{ticket.className}</Text>
              <Text style={styles.ticketTime}>{ticket.time}</Text>
            </View>
            <View style={[
              styles.ticketStatus,
              ticket.status === 'confirmed' ? styles.statusConfirmed : styles.statusWaitlist
            ]}>
              <Text style={styles.statusText}>
                {ticket.status === 'confirmed' ? 'Confirmed' : 'Waitlist'}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* <TouchableOpacity style={styles.scanAgainButton} onPress={resetToScanning}>
        <RotateCcw color="white" size={20} />
        <Text style={styles.scanAgainText}>Scan Again</Text>
      </TouchableOpacity> */}
    </View>
  );

  const renderNoTicketsView = () => (
    <View style={styles.noTicketsContainer}>
      <Text style={styles.noTicketsTitle}>No Tickets Found</Text>
      <Text style={styles.noTicketsMessage}>
        No bookings were found for this venue. Please check with the front desk or try scanning again.
      </Text>

      <TouchableOpacity style={styles.scanAgainButton} onPress={resetToScanning}>
        <RotateCcw color="white" size={20} />
        <Text style={styles.scanAgainText}>Scan Again</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>
          {modalState === 'scanning' ? 'Scan QR Code' :
            modalState === 'single-ticket' ? 'Your Ticket' :
              modalState === 'multiple-tickets' ? 'Select Ticket' :
                modalState === 'selected-ticket' ? 'Your Ticket' : 'No Tickets'}
        </Text>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeButton}>
          <X color="#000" size={24} />
        </TouchableOpacity>
      </View>

      {modalState === 'scanning' && renderScanningView()}
      {modalState === 'single-ticket' && renderSingleTicketView()}
      {modalState === 'multiple-tickets' && renderMultipleTicketsView()}
      {modalState === 'selected-ticket' && renderSelectedTicketView()}
      {modalState === 'no-tickets' && renderNoTicketsView()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  permissionContainer: {
    flex: 1,
    backgroundColor: 'white',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  closeButton: {
    padding: 4,
  },
  cameraContainer: {
    flex: 1,
    position: 'relative',
    backgroundColor: 'black',
    borderRadius: 12,
    margin: 16,
    overflow: 'hidden',
  },
  camera: {
    flex: 1,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanArea: {
    width: 250,
    height: 250,
    borderWidth: 2,
    borderColor: '#dedede',
    borderRadius: 12,
    backgroundColor: 'transparent',
  },
  instruction: {
    color: 'white',
    fontSize: 16,
    marginTop: 20,
    textAlign: 'center',
  },
  permissionContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  message: {
    color: '#666',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#ff4747',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  testButtonsContainer: {
    position: 'absolute',
    bottom: 50,
    flexDirection: 'row',
    gap: 10,
  },
  testButton: {
    backgroundColor: '#ff4747',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  testButtonMultiple: {
    backgroundColor: '#3B82F6',
  },
  testButtonFail: {
    backgroundColor: '#666',
  },
  testButtonText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
  },
  singleTicketContainer: {
    flex: 1,
    backgroundColor: 'white',
    padding: 16,
  },
  ticketWrapper: {
    marginBottom: 24,
    shadowColor: '#000',
    backgroundColor: 'white',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e5e5e5',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  ticketMainBody: {
    // backgroundColor: 'white',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    overflow: 'hidden',
  },
  ticketHeader: {
    // backgroundColor: 'white', // '#54a254', // green
    paddingVertical: 16,
    paddingHorizontal: 16,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
  },
  bookedBy: {
    color: "#222222",
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  ticketHeaderTitle: {
    color: '#1f2937', // '#fff', // white
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 4,
  },
  ticketContent: {
    paddingHorizontal: 24,
    paddingVertical: 24,
  },
  venueSection: {
    alignItems: 'center',
    paddingBottom: 16,
    marginBottom: 12,
  },
  businessName: {
    marginTop: 2,
    fontSize: 16,
    color: '#6b7280', // '#fff', // white
  },
  instructorName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  dateTimeSection: {
    alignItems: 'center',
    marginBottom: 12,
  },
  dateTimeLabel: {
    fontSize: 10,
    color: '#6b7280',
    fontWeight: '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  dateText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#222222',
    lineHeight: 56,
  },
  timeText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#dc2626',
  },
  attendeeSection: {
    backgroundColor: '#f5f5f5',
    borderWidth: 2,
    borderColor: '#6b7280',
    borderStyle: 'dashed',
    borderRadius: 8,
    paddingVertical: 16,
    paddingHorizontal: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  attendeeLabel: {
    fontSize: 10,
    color: '#6b7280',
    fontWeight: '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  attendeeName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  statusSection: {
    alignItems: 'center',
  },
  statusBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  perforatedEdge: {
    position: 'relative',
    height: 16,
    // backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dashedLine: {
    position: 'absolute',
    top: '50%',
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: 'transparent',
    borderTopWidth: 2,
    borderTopColor: '#d1d5db',
    borderStyle: 'dashed',
  },
  circularCutout: {
    position: 'absolute',
    width: 16,
    height: 16,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    top: '50%',
    marginTop: -8,
  },
  leftCutout: {
    left: -8,
  },
  rightCutout: {
    right: -8,
  },
  ticketStub: {
    // backgroundColor: 'white',
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  stubContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stubLeft: {
    flex: 1,
  },
  stubTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  stubDateTime: {
    fontSize: 12,
    color: '#6b7280',
  },
  stubRight: {
    alignItems: 'flex-end',
  },
  stubName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  stubStatus: {
    fontSize: 12,
    fontWeight: '500',
  },
  stubStatusConfirmed: {
    color: '#54a254',
  },
  stubStatusWaitlist: {
    color: '#f97316',
  },
  actionButtonsContainer: {
    gap: 12,
  },
  confirmButton: {
    backgroundColor: '#54a254',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  confirmButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  confirmHelpText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 4,
  },
  backButton: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#d1d5db',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  backButtonText: {
    color: '#374151',
    fontSize: 16,
    fontWeight: '500',
  },
  resultsContainer: {
    flex: 1,
    padding: 20,
  },
  resultsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 4,
  },
  resultsSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
  },
  ticketsList: {
    flex: 1,
  },
  ticketItem: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  ticketInfo: {
    flex: 1,
  },
  ticketCustomer: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  ticketClass: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  ticketTime: {
    fontSize: 14,
    color: '#666',
  },
  ticketStatus: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusConfirmed: {
    backgroundColor: '#10B981',
  },
  statusWaitlist: {
    backgroundColor: '#F59E0B',
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  noTicketsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  noTicketsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 12,
  },
  noTicketsMessage: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 30,
  },
  scanAgainButton: {
    backgroundColor: '#ff4747',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  scanAgainText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});