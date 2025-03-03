import { View, Text, FlatList, StyleSheet, TouchableOpacity } from "react-native"

const dummyOrders = [
  { id: "1", customerName: "John Doe", total: 50, status: "Pending" },
  { id: "2", customerName: "Jane Smith", total: 75, status: "Shipped" },
  { id: "3", customerName: "Bob Johnson", total: 100, status: "Delivered" },
]

export default function OrdersScreen() {
  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.item}
      onPress={() => {
        // TODO: Implement order details view
        console.log("View order details:", item)
      }}
    >
      <Text style={styles.customerName}>{item.customerName}</Text>
      <Text>Total: ${item.total}</Text>
      <Text>Status: {item.status}</Text>
    </TouchableOpacity>
  )

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Orders</Text>
      <FlatList data={dummyOrders} renderItem={renderItem} keyExtractor={(item) => item.id} />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
  },
  item: {
    backgroundColor: "#f9f9f9",
    padding: 16,
    marginVertical: 8,
    borderRadius: 8,
  },
  customerName: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 4,
  },
})

