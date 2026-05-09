import { aceConstants } from "@/constants/aceConstants";
import { useHttp } from "@/services/app.services";
import { createMaterialTopTabNavigator } from "@react-navigation/material-top-tabs";
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

import Checkbox from "expo-checkbox";
import { useNavigation } from "expo-router";
import React, { useEffect, useState } from "react";
import * as SecureStore from 'expo-secure-store';

import {
  ActivityIndicator,
  Dimensions,
  ImageBackground,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { endpointConstants } from "@/constants/endpoint";
import { getCompUrl } from "@/services/common.services";

const { width } = Dimensions.get("window");

type ApprovalItem = {
  Autonum: number;
  Year: string;
  DocNo: string;
  DocType: string;
  DocDt: string;
  Name: string;
  Detail: string;
  Reference: string;
  Amount: number;
  DocTypeLvl: string;
  Posted: string;
  LevelStatus: string;
  CompID: string;
  ModuleID: string;
  ShortName: string;
  EUser: string;
  UserID: string;
  Levels: number;
  LevelDefinition: string;
  ReceivedFrom: string;
  Query: string;
  AttachmentCount: number;
  ApprovalType: boolean;
};
type UpdateDocDetails = {
  AUTONUM: number;
  USERID: string;
  COMPID: string;
  LEVELSTATUS: string;
  DOCTYPE: string;
  MODULE: string;
  FROMUSER: string;
  REMARKS: string;
  LINEWISE: string;
  LEVELS: string;
};

// const userId = "AceFin";
// const compId = "ACE";
  
function Receivables() {
  const [receivablesData, setReceivablesData] = useState<ApprovalItem[]>([]);
  const detailNav = useNavigation();
  const [selectAll, setSelectAll] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const useHttpService = useHttp();
  const [details, setDetails] = useState<UpdateDocDetails | any>();
  useEffect(() => {}, [details, selectAll]);

  const updateDocDetails = async () => {
       const userId = await SecureStore.getItemAsync("userId");
      const compId = await SecureStore.getItemAsync("compId");
      const compUrl =  await getCompUrl();
    if (selectAll) {
      const dataAllValues = receivablesData.map((item: any) => ({
        AUTONUM: item.Autonum,
        USERID: userId,
        COMPID: item.CompID,
        LEVELSTATUS: item.ApprovalType ? "Approved" : "P",
        DOCTYPE: item.DocType,
        MODULE: aceConstants.MODULES.RECEIVABLES,
        FROMUSER: item.UserID,
        REMARKS: "",
        LINEWISE: "",
        LEVELS: item.Levels,
      }));
      const data = await useHttpService
        .sendRequest(
          `${compUrl}/api/${endpointConstants.UPDATEDOCAPPROVAL}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: dataAllValues,
          }
        )
        .then(async (response: any) => {
          if (response) {
              console.log('request', dataAllValues);
          console.log('response', response);
                        apiData();
          } else {
          }
        });
    } else {
      const dataValues = details.map((item: any) => ({
        AUTONUM: item.Autonum,
        USERID: userId,
        COMPID: item.CompID,
        LEVELSTATUS: item.ApprovalType ? "Approved" : "P",
        DOCTYPE: item.DocType,
        MODULE: aceConstants.MODULES.RECEIVABLES,
        FROMUSER: item.UserID,
        REMARKS: "",
        LINEWISE: "",
        LEVELS: item.Levels,
      }));
      const data = await useHttpService
        .sendRequest(
          `${compUrl}/api/${endpointConstants.UPDATEDOCAPPROVAL}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: dataValues,
          }
        )
        .then(async (response: any) => {
          if (response) {
                       console.log('request', dataValues);
          console.log('response', response);
            apiData();
          } else {
          }
        });
    }
  };

  useEffect(() => {
    apiData();
  }, []);

  useEffect(() => {
    const updatedData = receivablesData.map((item) => ({
      ...item,
      ApprovalType: selectAll,
    }));
    setReceivablesData(updatedData);
  }, [selectAll]);

  const apiData = async () => {
    setIsLoading(true);
    try {
      const compUrl =  await getCompUrl();
      const compId = await SecureStore.getItemAsync("compId");
      const userId =  await SecureStore.getItemAsync("userId");

        const apiurl = `${compUrl}/api/${endpointConstants.GETAPPROVAL}/all/${userId}/${aceConstants.MODULES.RECEIVABLES}`
      const data = await useHttpService
        .sendRequest(
          apiurl,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
          }
        )
        .then(async (response: any) => {
          if (response) {
            if (response?.Data?.ApprovalDetails) {
        
              setReceivablesData(response.Data.ApprovalDetails);
            }

          } else {
          }
        });
    } catch (err: any) {
      console.error("Error fetching data", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDetailPress = (item: any) => {
    // @ts-ignore
    detailNav.navigate("Detail", { item });
  };

  const [modalVisible, setModalVisible] = useState(false);
  const [selectedDetail, setSelectedDetail] = useState<ApprovalItem | null>(
    null
  );
  const updateDetails: any = [];
  const [item, setSelectedItem] = useState<ApprovalItem | null>(null);
  return (
    <View style={styles.tabContent}>
      {isLoading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#04447c" />
        </View>
      ) : (
        <>
  <View style={styles.tableHeaderTopRow}>
  {(selectAll===true || details?.length>0) ? (
    <View style={styles.updateIconContainer}>
      <TouchableOpacity 
        style={styles.approveButton}
        onPress={() => updateDocDetails()}
      >
        <View style={styles.approveButtonContent}>
          <MaterialIcons name="approval" size={24} color="#04447c" />
          <Text style={styles.approveButtonText}>Approve</Text>
        </View>
      </TouchableOpacity>
    </View>
  ):''}
</View>

      <View style={styles.tableHeaderRow}>
        <Text style={[styles.tableHeaderText, { maxWidth: 35 }]}>CMP</Text>
        <Text style={styles.tableHeaderText}>DOC</Text>
        <Text style={[styles.tableHeaderText, { minWidth: 30 }]}>DNO</Text>
        <Text style={[styles.tableHeaderText, { minWidth: 30 }]}>DATE</Text>

        <Text style={styles.tableHeaderText}>REC</Text>
        <Text style={[styles.tableHeaderText, { minWidth: 35 }]}>AMT</Text>
        <View style={styles.checkboxcontainer}>
          <Checkbox
            value={selectAll}
            onValueChange={setSelectAll}
            style={{
              borderRadius: 4,
              borderColor: "#04447c",
              backgroundColor: selectAll ? "#04447c" : "transparent",
            }}
            color={"#04447c"}
          />
        </View>
        <Text style={styles.checkboxcontainer}></Text>
      </View>

      <ScrollView>
        {!receivablesData || receivablesData.length === 0 ? (
          <View style={{ alignItems: "center", marginTop: 20 }}>
            <Text>No data yet</Text>
          </View>
        ) : (
          receivablesData.map((item) => (
            <View style={styles.rowborder} key={item.Autonum}>
              <View style={{ flexDirection: "row" }}>
                <Text
                  onPress={() => {
                    setSelectedDetail(item);
                    setModalVisible(true);
                  }}
                  style={[
                    styles.tableRowText,
                    { color: "#04447c", maxWidth: 35, fontWeight: "bold" },
                  ]}
                >
                  {item.CompID}
                </Text>
                <Text style={styles.tableRowText}>{item.DocType}</Text>
                <Text style={[styles.tableRowText, { minWidth: 30 }]}>
                  {item.DocNo}
                </Text>
                <Text style={[styles.tableRowText, { minWidth: 30 }]}>
                  {item.DocDt}
                </Text>
                <Text
                  style={styles.tableRowText}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {item.ReceivedFrom}
                </Text>
                <Text style={[styles.tableRowText, { minWidth: 35 }]}>
                  {item.Amount}
                </Text>

                <View style={styles.checkboxcontainer}>
                  <Checkbox
                    value={item?.ApprovalType || false}
                    onValueChange={(newValue) => {
                      if (newValue) {
                        if (!Array.isArray(details) || details.length === 0) {
                          setDetails([item]); // initialize with the first item
                        } else {
                          setDetails((prev: any[]) => {
                            const exists = prev.some(
                              (d) => d.Autonum === item.Autonum
                            );
                            if (exists) {
                              return prev; // Skip if already exists
                            }
                            return [...prev, item]; // Add new item
                          });
                        }
                      } else {
                        const filteredDetails = details?.filter(
                          (detail: any) => detail.Autonum !== item.Autonum
                        );
                        setDetails(filteredDetails);
                      }
                      // Create a copy of the current data array
                      const updatedData = [...receivablesData];
                      // Find the index of the item being updated
                      const itemIndex = updatedData.findIndex(
                        (dataItem) => dataItem.Autonum === item.Autonum
                      );

                      // If the item is found, update its ApprovalType
                      if (itemIndex !== -1) {
                        updatedData[itemIndex] = {
                          ...updatedData[itemIndex],
                          ApprovalType: newValue,
                        };

                        // Update the state with the new array
                        setReceivablesData(updatedData);
                      }
                    }}
                    style={{
                      borderRadius: 4,
                      borderColor: "#04447c",
                      backgroundColor: item?.ApprovalType
                        ? "#04447c"
                        : "transparent",
                    }}
                    color={"#04447c"}
                  />
                </View>

                <TouchableOpacity onPress={() => handleDetailPress(item)}>
                  <Icon
                    name="chevron-right"
                    size={24}
                    style={styles.navigateIcon}
                  />
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>      

      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: "rgba(0,0,0,0.3)",
          }}
        >
          <View
            style={{
              backgroundColor: "#fff",
              padding: 20,
              borderRadius: 10,
              width: "80%",
            }}
          >
            {selectedDetail && (
              <>
                <Text style={styles.headerText}>Detail</Text>
                <Text>Company: {selectedDetail.CompID}</Text>
                <Text>Document: {selectedDetail.DocType}</Text>
                <Text>Doc No: {selectedDetail.DocNo}</Text>
                <Text>Date: {selectedDetail.DocDt}</Text>
                <Text>Name: {selectedDetail.Name}</Text>
                <Text>Detail: {selectedDetail.Detail}</Text>
                <Text>Ref: {selectedDetail.Reference}</Text>
                <Text>Amount: {selectedDetail.Amount}</Text>
                <Text>Attach: {selectedDetail.AttachmentCount}</Text>
                <Text>Role: {selectedDetail.LevelDefinition}</Text>

                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <Text>Select :</Text>
                  <Checkbox
                    style={{ marginLeft: 5, marginTop: 2 }}
                    value={selectedDetail?.ApprovalType || false}
                    onValueChange={(newValue) => {
                      if (selectedDetail) {
                        // Update ApprovalType for selectedDetail
                        setSelectedDetail({ ...selectedDetail, ApprovalType: newValue });

                        // Update details array
                        if (newValue) {
                          if (!Array.isArray(details) || details.length === 0) {
                            setDetails([selectedDetail]);
                          } else {
                            setDetails((prev: any[]) => {
                              const exists = prev.some(
                                (d) => d.Autonum === selectedDetail?.Autonum
                              );
                              if (exists) {
                                return prev;
                              }
                              return [...prev, selectedDetail];
                            });
                          }
                        } else {
                          const filteredDetails = details?.filter(
                            (detail: any) => detail.Autonum !== selectedDetail?.Autonum
                          );
                          setDetails(filteredDetails);
                        }

                        // Update ApprovalType in receivablesData
                        const updatedData = receivablesData.map((dataItem) =>
                          dataItem?.Autonum === selectedDetail?.Autonum
                            ? { ...dataItem, ApprovalType: newValue }
                            : dataItem
                        );
                        setReceivablesData(updatedData);
                      }
                    }}
                  />
                </View>
              </>
            )}
            <TouchableOpacity
              style={{ marginTop: 20, alignSelf: "flex-end" }}
              onPress={() => setModalVisible(false)}
            >
              <Text style={{ color: "#04447c", fontWeight: "bold" }}>
                Close
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      </>
      )}
    </View>
  );
}

function Payables() {
  const detailNav = useNavigation();
  const [PayablesData, setPayablesData] = useState<ApprovalItem[]>([]);
  const useHttpService = useHttp();
  const [details, setDetails] = useState<UpdateDocDetails | any>();
  const [isLoading, setIsLoading] = useState(false);

  const [selectAll, setSelectAll] = useState(false);
  useEffect(() => {}, [details, selectAll]);
  useEffect(() => {
    const updatedData = PayablesData.map((item) => ({
      ...item,
      ApprovalType: selectAll,
    }));
    setPayablesData(updatedData);
  }, [selectAll]);
  const updateDocDetails = async () => {
       const compUrl =  await getCompUrl();
      const compId = await SecureStore.getItemAsync("compId");
      const userId = await SecureStore.getItemAsync("userId");
    if (selectAll) {
      const dataAllValues = PayablesData.map((item: any) => ({
        AUTONUM: item.Autonum,
        USERID: userId,
        COMPID: item.CompID,
        LEVELSTATUS: item.ApprovalType ? "Approved" : "P",
        DOCTYPE: item.DocType,
        MODULE: aceConstants.MODULES.PAYABLES,
        FROMUSER: item.UserID,
        REMARKS: "",
        LINEWISE: "",
        LEVELS: item.Levels,
      }));
      const data = await useHttpService
        .sendRequest(
          `${compUrl}/api/${endpointConstants.UPDATEDOCAPPROVAL}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: dataAllValues,
          }
        )
        .then(async (response: any) => {
          if (response) {
                          console.log('request', dataAllValues);
          console.log('response', response);
             apiData();
          } else {
          }
        });
    } else {
      const dataValues = details.map((item: any) => ({
        AUTONUM: item.Autonum,
        USERID: userId,
        COMPID: item.CompID,
        LEVELSTATUS: item.ApprovalType ? "Approved" : "P",
        DOCTYPE: item.DocType,
        MODULE: aceConstants.MODULES.PAYABLES,
        FROMUSER: item.UserID,
        REMARKS: "",
        LINEWISE: "",
        LEVELS: item.Levels,
      }));


      const payableupdateurl = `${compUrl}/api/${endpointConstants.UPDATEDOCAPPROVAL}`;
      console.log('payableupdateurl', payableupdateurl);
      console.log('dataValues', dataValues);
      const data = await useHttpService
        .sendRequest(
         payableupdateurl,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: dataValues,
          }
        )
        .then(async (response: any) => {
          if (response) {
                          console.log('request', dataValues);
          console.log('response', response);
             apiData();
          } else {
          }
        });
    }
  };
  useEffect(() => {
    apiData();
  }, []);
  const apiData = async () => {
    setIsLoading(true);
    try {
    const compUrl =  await getCompUrl();
      const compId = await SecureStore.getItemAsync("compId");
      const userId = await SecureStore.getItemAsync("userId");
      const data = await useHttpService
        .sendRequest(
          `${compUrl}/api/${endpointConstants.GETAPPROVAL}/all/${userId}/${aceConstants.MODULES.PAYABLES}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
          }
        )
        .then(async (response: any) => {
          if (response) {
            if (response?.Data?.ApprovalDetails) {
              setPayablesData(response.Data.ApprovalDetails);
            }

          } else {
          }
        });
    } catch (err: any) {
      console.error("Error fetching data", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDetailPress = (item: any) => {
    // @ts-ignore
    detailNav.navigate("Detail", { item });
  };

  const [modalVisible, setModalVisible] = useState(false);
  const [selectedDetail, setSelectedDetail] = useState<ApprovalItem | null>(
    null
  );

  const [item, setSelectedItem] = useState<ApprovalItem | null>(null);
  return (
    <View style={styles.tabContent}>
      {isLoading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#04447c" />
        </View>
      ) : (
        <>
    <View style={styles.tableHeaderTopRow}>
 {(selectAll===true || details?.length>0) ? (
    <View style={styles.updateIconContainer}>
      <TouchableOpacity 
        style={styles.approveButton}
        onPress={() => updateDocDetails()}
      >
        <View style={styles.approveButtonContent}>
          <MaterialIcons name="approval" size={24} color="#04447c" />
          <Text style={styles.approveButtonText}>Approve</Text>
        </View>
      </TouchableOpacity>
    </View>
  ):''}
</View>

      <View style={styles.tableHeaderRow}>
        <Text style={[styles.tableHeaderText, { maxWidth: 35 }]}>CMP</Text>
        <Text style={styles.tableHeaderText}>DOC</Text>
        <Text style={[styles.tableHeaderText, { minWidth: 30 }]}>DNo</Text>
        <Text style={[styles.tableHeaderText, { minWidth: 30 }]}>DATE</Text>

        <Text style={styles.tableHeaderText}>REC</Text>
        <Text style={[styles.tableHeaderText, { minWidth: 35 }]}>AMT</Text>
        <View style={styles.checkboxcontainer}>
          <Checkbox
            value={selectAll}
            onValueChange={setSelectAll}
            style={{
              borderRadius: 4,
              borderColor: "#04447c",
              backgroundColor: selectAll ? "#04447c" : "transparent",
            }}
            color={"#04447c"}
          />
        </View>
        <Text style={styles.checkboxcontainer}></Text>
      </View>
      <ScrollView>
        {!PayablesData || PayablesData.length === 0 ? (
          <View style={{ alignItems: "center", marginTop: 20 }}>
            <Text>No data yet</Text>
          </View>
        ) : (
          PayablesData.map((item) => (
            <View style={styles.rowborder} key={item.Autonum}>
              <View style={{ flexDirection: "row" }}>
                <Text
                  onPress={() => {
                    setSelectedDetail(item);
                    setModalVisible(true);
                  }}
                  style={[
                    styles.tableRowText,
                    { color: "#04447c", maxWidth: 35, fontWeight: "bold" },
                  ]}
                >
                  {item.CompID}
                </Text>
                <Text style={styles.tableRowText}>{item.DocType}</Text>
                <Text style={[styles.tableRowText, { minWidth: 30 }]}>
                  {item.DocNo}
                </Text>
                <Text style={[styles.tableRowText, { minWidth: 30 }]}>
                  {item.DocDt}
                </Text>
                <Text
                  style={styles.tableRowText}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {item.ReceivedFrom}
                </Text>
                <Text style={[styles.tableRowText, { minWidth: 35 }]}>
                  {item.Amount}
                </Text>

                <View style={styles.checkboxcontainer}>
                  <Checkbox
                    value={item?.ApprovalType || false}
                    onValueChange={(newValue) => {
                      if (newValue) {
                        if (!Array.isArray(details) || details.length === 0) {
                          setDetails([item]); // initialize with the first item
                        } else {
                          setDetails((prev: any[]) => {
                            const exists = prev.some(
                              (d) => d.Autonum === item.Autonum
                            );
                            if (exists) {
                              return prev; // Skip if already exists
                            }
                            return [...prev, item]; // Add new item
                          });
                        }
                      } else {
                        const filteredDetails = details?.filter(
                          (detail: any) => detail.Autonum !== item.Autonum
                        );
                        setDetails(filteredDetails);
                      }
                      // Create a copy of the current data array
                      const updatedData = [...PayablesData];
                      // Find the index of the item being updated
                      const itemIndex = updatedData.findIndex(
                        (dataItem) => dataItem.Autonum === item.Autonum
                      );

                      // If the item is found, update its ApprovalType
                      if (itemIndex !== -1) {
                        updatedData[itemIndex] = {
                          ...updatedData[itemIndex],
                          ApprovalType: newValue,
                        };

                        // Update the state with the new array
                        setPayablesData(updatedData);
                      }
                    }}
                    style={{
                      borderRadius: 4,
                      borderColor: "#04447c",
                      backgroundColor: item?.ApprovalType
                        ? "#04447c"
                        : "transparent",
                    }}
                    color={"#04447c"}
                  />
                </View>

                <TouchableOpacity onPress={() => handleDetailPress(item)}>
                  <Icon
                    name="chevron-right"
                    size={24}
                    style={styles.navigateIcon}
                  />
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>
      
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: "rgba(0,0,0,0.3)",
          }}
        >
          <View
            style={{
              backgroundColor: "#fff",
              padding: 20,
              borderRadius: 10,
              width: "80%",
            }}
          >
            {selectedDetail && (
              <>
                <Text style={styles.headerText}>Detail</Text>
                <Text>Company: {selectedDetail.CompID}</Text>
                <Text>Document: {selectedDetail.DocType}</Text>
                <Text>Doc No: {selectedDetail.DocNo}</Text>
                <Text>Date: {selectedDetail.DocDt}</Text>
                <Text>Name: {selectedDetail.Name}</Text>
                <Text>Detail: {selectedDetail.Detail}</Text>
                <Text>Ref: {selectedDetail.Reference}</Text>
                <Text>Amount: {selectedDetail.Amount}</Text>
                <Text>Attach: {selectedDetail.AttachmentCount}</Text>
                <Text>Role: {selectedDetail.LevelDefinition}</Text>

                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <Text>Select :</Text>
                  <Checkbox
                    style={{ marginLeft: 5, marginTop: 2 }}
                    value={selectedDetail?.ApprovalType || false}
                    onValueChange={(newValue) => {
                      if (selectedDetail) {
                        // Update ApprovalType for selectedDetail
                        setSelectedDetail({ ...selectedDetail, ApprovalType: newValue });

                        // Update details array
                        if (newValue) {
                          if (!Array.isArray(details) || details.length === 0) {
                            setDetails([selectedDetail]);
                          } else {
                            setDetails((prev: any[]) => {
                              const exists = prev.some(
                                (d) => d.Autonum === selectedDetail?.Autonum
                              );
                              if (exists) {
                                return prev;
                              }
                              return [...prev, selectedDetail];
                            });
                          }
                        } else {
                          const filteredDetails = details?.filter(
                            (detail: any) => detail.Autonum !== selectedDetail?.Autonum
                          );
                          setDetails(filteredDetails);
                        }

                        // Update ApprovalType in receivablesData
                        const updatedData = PayablesData.map((dataItem) =>
                          dataItem?.Autonum === selectedDetail?.Autonum
                            ? { ...dataItem, ApprovalType: newValue }
                            : dataItem
                        );
                        setPayablesData(updatedData);
                      }
                    }}
                  />
                </View>
              </>
            )}
            <TouchableOpacity
              style={{ marginTop: 20, alignSelf: "flex-end" }}
              onPress={() => setModalVisible(false)}
            >
              <Text style={{ color: "#04447c", fontWeight: "bold" }}>
                Close
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      </>
      )}
    </View>
  );
}

function Materials() {
  const detailNav = useNavigation();
  const useHttpService = useHttp();
  const [MaterialsData, setMaterialsData] = useState<ApprovalItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  useEffect(() => {
    apiData();
  }, []);
  const apiData = async () => {
    try {
      setIsLoading(true);
      const compUrl =  await getCompUrl();
      const compId = await SecureStore.getItemAsync("compId");
      const userId = await SecureStore.getItemAsync("userId");
      const data = await useHttpService
        .sendRequest(
          `${compUrl}/api/${endpointConstants.GETAPPROVAL}/all/${userId}/${aceConstants.MODULES.MATERIALS}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
          }
        )
        .then(async (response: any) => {
          if (response) {
            if (response?.Data?.ApprovalDetails) {
              setMaterialsData(response.Data.ApprovalDetails);
            }
          }
        });

    } catch (err: any) {
      console.error("Error fetching data", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDetailPress = (item: any) => {
    // @ts-ignore
    detailNav.navigate("Detail", { item });
  };

  const [modalVisible, setModalVisible] = useState(false);
  const [selectedDetail, setSelectedDetail] = useState<ApprovalItem | null>(
    null
  );

  const [item, setSelectedItem] = useState<ApprovalItem | null>(null);
  const [selectAll, setSelectAll] = useState(false);
  const [details, setDetails] = useState<UpdateDocDetails | any>();
  useEffect(() => {
  }, [details, selectAll]);

  const updateDocDetails = async () => {
       const compUrl =  await getCompUrl();
      const userId = await SecureStore.getItemAsync("userId");
    if (selectAll) {
      const dataAllValues = MaterialsData.map((item: any) => ({
        AUTONUM: item.Autonum,
        USERID: userId,
        COMPID: item.CompID,
        LEVELSTATUS: item.ApprovalType ? "Approved" : "P",
        DOCTYPE: item.DocType,
        MODULE: aceConstants.MODULES.MATERIALS,
        FROMUSER: item.UserID,
        REMARKS: "",
        LINEWISE: "",
        LEVELS: item.Levels,
      }));
      const data = await useHttpService
        .sendRequest(
          `${compUrl}/api/${endpointConstants.UPDATEDOCAPPROVAL}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: dataAllValues,
          }
        )
        .then(async (response: any) => {
        
          if (response) {
             apiData();
          } else {
          }
        });
    } else {
      const dataValues = details.map((item: any) => ({
        AUTONUM: item.Autonum,
        USERID: userId,
        COMPID: item.CompID,
        LEVELSTATUS: item.ApprovalType ? "Approved" : "P",
        DOCTYPE: item.DocType,
        MODULE: aceConstants.MODULES.MATERIALS,
        FROMUSER: item.UserID,
        REMARKS: "",
        LINEWISE: "",
        LEVELS: item.Levels,
      }));
      const data = await useHttpService
        .sendRequest(
          `${compUrl}/api/${endpointConstants.UPDATEDOCAPPROVAL}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: dataValues,
          }
        )
        .then(async (response: any) => {
          if (response) {

             apiData();
          } else {
          }
        });
    }
  };
  useEffect(() => {
    const updatedData = MaterialsData.map((item) => ({
      ...item,
      ApprovalType: selectAll,
    }));
    setMaterialsData(updatedData);
  }, [selectAll]);
  return (
    <View style={styles.tabContent}>
      {isLoading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#04447c" />
        </View>
      ) : (
        <>
      <View style={styles.tableHeaderTopRow}>
  {(selectAll===true || details?.length>0) ? (
    <View style={styles.updateIconContainer}>
      <TouchableOpacity 
        style={styles.approveButton}
        onPress={() => updateDocDetails()}
      >
        <View style={styles.approveButtonContent}>
          <MaterialIcons name="approval" size={24} color="#04447c" />
          <Text style={styles.approveButtonText}>Approve</Text>
        </View>
      </TouchableOpacity>
    </View>
  ):''}
</View>

      <View style={styles.tableHeaderRow}>
        <Text style={[styles.tableHeaderText, { maxWidth: 35 }]}>CMP</Text>
        <Text style={styles.tableHeaderText}>DOC</Text>
        <Text style={[styles.tableHeaderText, { minWidth: 30 }]}>DNO</Text>
        <Text style={[styles.tableHeaderText, { minWidth: 30 }]}>DATE</Text>

        <Text style={styles.tableHeaderText}>REC</Text>
        <Text style={[styles.tableHeaderText, { minWidth: 35 }]}>AMT</Text>
        <View style={styles.checkboxcontainer}>
          <Checkbox
            value={selectAll}
            onValueChange={setSelectAll}
            style={{
              borderRadius: 4,
              borderColor: "#04447c",
              backgroundColor: selectAll ? "#04447c" : "transparent",
            }}
            color={"#04447c"}
          />
        </View>
        <Text style={styles.checkboxcontainer}></Text>
      </View>
      <ScrollView>
        {!MaterialsData || MaterialsData.length === 0 ? (
          <View style={{ alignItems: "center", marginTop: 20 }}>
            <Text>No data yet</Text>
          </View>
        ) : (
          MaterialsData.map((item) => (
            <View style={ item.ApprovalType.toString()==='Y'? styles.rowApproval:styles.rowborder} key={item.Autonum}>
              <View style={{ flexDirection: "row" }}>
                <Text
                  onPress={() => {
                    setSelectedDetail(item);
                    setModalVisible(true);
                  }}
                  style={[
                    styles.tableRowText,
                    { color: "#04447c", maxWidth: 35, fontWeight: "bold" },
                  ]}
                >
                  {item.CompID}
                </Text>
                <Text style={styles.tableRowText}>{item.DocType}</Text>
                <Text style={[styles.tableRowText, { minWidth: 30 }]}>
                  {item.DocNo}
                </Text>
                <Text style={[styles.tableRowText, { minWidth: 30 }]}>
                  {item.DocDt}
                </Text>
                <Text
                  style={styles.tableRowText}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {item.ReceivedFrom}
                </Text>
                <Text style={[styles.tableRowText, { minWidth: 35 }]}>
                  {item.Amount}
                </Text>

                <View style={styles.checkboxcontainer}>
                  <Checkbox
                    value={item?.ApprovalType?.toString()!=='Y' && item.ApprovalType || false}
                    onValueChange={(newValue) => {
                      if (newValue) {
                        if (!Array.isArray(details) || details.length === 0) {
                          setDetails([item]); // initialize with the first item
                        } else {
                          setDetails((prev: any[]) => {
                            const exists = prev.some(
                              (d) => d.Autonum === item.Autonum
                            );
                            if (exists) {
                              return prev; // Skip if already exists
                            }
                            return [...prev, item]; // Add new item
                          });
                        }
                      } else {
                        const filteredDetails = details?.filter(
                          (detail: any) => detail.Autonum !== item.Autonum
                        );
                        setDetails(filteredDetails);
                      }
                      // Create a copy of the current data array
                      const updatedData = [...MaterialsData];
                      // Find the index of the item being updated
                      const itemIndex = updatedData.findIndex(
                        (dataItem) => dataItem.Autonum === item.Autonum
                      );

                      // If the item is found, update its ApprovalType
                      if (itemIndex !== -1) {
                        updatedData[itemIndex] = {
                          ...updatedData[itemIndex],
                          ApprovalType: newValue,
                        };

                        // Update the state with the new array
                        setMaterialsData(updatedData);
                      }
                    }}
                    style={{
                      borderRadius: 4,
                      borderColor: "#04447c",
                      backgroundColor: item?.ApprovalType
                        ? "#04447c"
                        : "transparent",
                    }}
                    color="#04447c"
                  />
                </View>

                <TouchableOpacity onPress={() => handleDetailPress(item)}>
                  <Icon
                    name="chevron-right"
                    size={24}
                    style={styles.navigateIcon}
                  />
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>
      
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: "rgba(0,0,0,0.3)",
          }}
        >
          <View
            style={{
              backgroundColor: "#fff",
              padding: 20,
              borderRadius: 10,
              width: "80%",
            }}
          >
            {selectedDetail && (
              <>
              <Text style={styles.headerText}>Detail</Text>
              <Text>Company: {selectedDetail.CompID}</Text>
              <Text>Document: {selectedDetail.DocType}</Text>
              <Text>Doc No: {selectedDetail.DocNo}</Text>
              <Text>Date: {selectedDetail.DocDt}</Text>
              <Text>Name: {selectedDetail.Name}</Text>
              <Text>Detail: {selectedDetail.Detail}</Text>
              <Text>Ref: {selectedDetail.Reference}</Text>
              <Text>Amount: {selectedDetail.Amount}</Text>
              <Text>Attach: {selectedDetail.AttachmentCount}</Text>
              <Text>Role: {selectedDetail.LevelDefinition}</Text>

              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Text>Select :</Text>
                <Checkbox
                style={{ marginLeft: 5, marginTop: 2 }}
                value={selectedDetail?.ApprovalType?.toString()!=='Y' || false}
              onValueChange={(newValue) => {
                      if (selectedDetail) {
                        // Update ApprovalType for selectedDetail
                        setSelectedDetail({ ...selectedDetail, ApprovalType: newValue });

                        // Update details array
                        if (newValue) {
                          if (!Array.isArray(details) || details.length === 0) {
                            setDetails([selectedDetail]);
                          } else {
                            setDetails((prev: any[]) => {
                              const exists = prev.some(
                                (d) => d.Autonum === selectedDetail?.Autonum
                              );
                              if (exists) {
                                return prev;
                              }
                              return [...prev, selectedDetail];
                            });
                          }
                        } else {
                          const filteredDetails = details?.filter(
                            (detail: any) => detail.Autonum !== selectedDetail?.Autonum
                          );
                          setDetails(filteredDetails);
                        }

                        // Update ApprovalType in receivablesData
                        const updatedData = MaterialsData.map((dataItem) =>
                          dataItem?.Autonum === selectedDetail?.Autonum
                            ? { ...dataItem, ApprovalType: newValue }
                            : dataItem
                        );
                        setMaterialsData(updatedData);
                      }
                    }}
                />
              </View>
              </>
            )}
            <TouchableOpacity
              style={{ marginTop: 20, alignSelf: "flex-end" }}
              onPress={() => setModalVisible(false)}
            >
              <Text style={{ color: "#04447c", fontWeight: "bold" }}>
                Close
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      </>
      )}
    </View>
  );
}

function GendralLedger() {
  const detailNav = useNavigation();
  const useHttpService = useHttp();
  const [GendralLedgerData, setGendralLedgerData] = useState<ApprovalItem[]>(
    []
  );
  const [selectAll, setSelectAll] = useState(false);
  const [details, setDetails] = useState<UpdateDocDetails | any>();
  const [isLoading, setIsLoading] = useState(false);
  useEffect(() => {
    const updatedData = GendralLedgerData.map((item) => ({
      ...item,
      ApprovalType: selectAll,
    }));
    setGendralLedgerData(updatedData);
  }, [selectAll]);
  useEffect(() => {
    apiData();
  }, []);
  useEffect(() => {}, [details, selectAll]);
  const updateDocDetails = async () => {
       const compUrl =  await getCompUrl();
      const compId = await SecureStore.getItemAsync("compId");
      const userId = await SecureStore.getItemAsync("userId");
    if (selectAll) {
      const dataAllValues = GendralLedgerData.map((item: any) => ({
        AUTONUM: item.Autonum,
        USERID: userId,
        COMPID: item.CompID,
        LEVELSTATUS: item.ApprovalType ? "Approved" : "P",
        DOCTYPE: item.DocType,
        MODULE: aceConstants.MODULES.GENERAL_LEDGER,
        FROMUSER: item.UserID,
        REMARKS: "",
        LINEWISE: "",
        LEVELS: item.Levels,
      }));
      const data = await useHttpService
        .sendRequest(
          `${compUrl}/api/${endpointConstants.UPDATEDOCAPPROVAL}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: dataAllValues,
          }
        )
        .then(async (response: any) => {
          if (response) {
                       console.log('request', dataAllValues);
          console.log('response', response);
             apiData();
          } else {
          }
        });
    } else {
      const dataValues = details.map((item: any) => ({
        AUTONUM: item.Autonum,
        USERID: userId,
        COMPID: item.CompID,
        LEVELSTATUS: item.ApprovalType ? "Approved" : "P",
        DOCTYPE: item.DocType,
        MODULE: aceConstants.MODULES.GENERAL_LEDGER,
        FROMUSER: item.UserID,
        REMARKS: "",
        LINEWISE: "",
        LEVELS: item.Levels,
      }));
      const data = await useHttpService
        .sendRequest(
          `${compUrl}/api/${endpointConstants.UPDATEDOCAPPROVAL}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: dataValues,
          }
        )
        .then(async (response: any) => {
          if (response) {
                       console.log('request', dataValues);
          console.log('response', response);
             apiData();
          } else {
          }
        });
    }
  };
  const apiData = async () => {
    setIsLoading(true);
    try {
   const compUrl =  await getCompUrl();
      const compId = await SecureStore.getItemAsync("compId");
      const userId = await SecureStore.getItemAsync("userId");      
      const data = await useHttpService
        .sendRequest(
          `${compUrl}/api/${endpointConstants.GETAPPROVAL}/all/${userId}/${aceConstants.MODULES.GENERAL_LEDGER}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
          }
        )
        .then(async (response: any) => {
          if (response) {
            if (response?.Data?.ApprovalDetails) {
              setGendralLedgerData(response.Data.ApprovalDetails);
            }
          } else {
          }
        });
    } catch (err: any) {
      console.error("Error fetching data", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDetailPress = (item: any) => {
    // @ts-ignore
    detailNav.navigate("Detail", { item });
  };

  const [modalVisible, setModalVisible] = useState(false);
  const [selectedDetail, setSelectedDetail] = useState<ApprovalItem | null>(
    null
  );

  const [item, setSelectedItem] = useState<ApprovalItem | null>(null);
  return (
    <View style={styles.tabContent}>
      {isLoading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#04447c" />
        </View>
      ) : (
        <>
  
      <View style={styles.tableHeaderTopRow}>
 {(selectAll===true || details?.length>0) ? (
    <View style={styles.updateIconContainer}>
      <TouchableOpacity 
        style={styles.approveButton}
        onPress={() => updateDocDetails()}
      >
        <View style={styles.approveButtonContent}>
          <MaterialIcons name="approval" size={24} color="#04447c" />
          <Text style={styles.approveButtonText}>Approve</Text>
        </View>
      </TouchableOpacity>
    </View>
  ):''}
</View>


      <View style={styles.tableHeaderRow}>
        <Text style={[styles.tableHeaderText, { maxWidth: 35 }]}>CMP</Text>
        <Text style={styles.tableHeaderText}>DOC</Text>
        <Text style={[styles.tableHeaderText, { minWidth: 30 }]}>DNO</Text>
        <Text style={[styles.tableHeaderText, { minWidth: 30 }]}>DATE</Text>

        <Text style={styles.tableHeaderText}>REC</Text>
        <Text style={[styles.tableHeaderText, { minWidth: 35 }]}>AMT</Text>
        <View style={styles.checkboxcontainer}>
          <Checkbox
            value={selectAll}
            onValueChange={setSelectAll}
            style={{
              borderRadius: 4,
              borderColor: "#04447c",
              backgroundColor: selectAll ? "#04447c" : "transparent",
            }}
            color={"#04447c"}
          />
        </View>
        <Text style={styles.checkboxcontainer}></Text>
      </View>
      <ScrollView>
        {!GendralLedgerData || GendralLedgerData.length === 0 ? (
          <View style={{ alignItems: "center", marginTop: 20 }}>
            <Text>No data yet</Text>
          </View>
        ) : (
          GendralLedgerData.map((item) => (
            <View style={styles.rowborder} key={item.Autonum}>
              <View style={{ flexDirection: "row" }}>
                <Text
                  onPress={() => {
                    setSelectedDetail(item);
                    setModalVisible(true);
                  }}
                  style={[
                    styles.tableRowText,
                    { color: "#04447c", maxWidth: 35, fontWeight: "bold" },
                  ]}
                >
                  {item.CompID}
                </Text>
                <Text style={styles.tableRowText}>{item.DocType}</Text>
                <Text style={[styles.tableRowText, { minWidth: 30 }]}>
                  {item.DocNo}
                </Text>
                <Text style={[styles.tableRowText, { minWidth: 30 }]}>
                  {item.DocDt}
                </Text>
                <Text
                  style={styles.tableRowText}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {item.ReceivedFrom}
                </Text>
                <Text style={[styles.tableRowText, { minWidth: 35 }]}>
                  {item.Amount}
                </Text>

                <View style={styles.checkboxcontainer}>
                  <Checkbox
                    value={item?.ApprovalType || false}
                    onValueChange={(newValue) => {
                      if (newValue) {
                        if (!Array.isArray(details) || details.length === 0) {
                          setDetails([item]); // initialize with the first item
                        } else {
                          setDetails((prev: any[]) => {
                            const exists = prev.some(
                              (d) => d.Autonum === item.Autonum
                            );
                            if (exists) {
                              return prev; // Skip if already exists
                            }
                            return [...prev, item]; // Add new item
                          });
                        }
                      } else {
                        const filteredDetails = details?.filter(
                          (detail: any) => detail.Autonum !== item.Autonum
                        );
                        setDetails(filteredDetails);
                      }
                      // Create a copy of the current data array
                      const updatedData = [...GendralLedgerData];
                      // Find the index of the item being updated
                      const itemIndex = updatedData.findIndex(
                        (dataItem) => dataItem.Autonum === item.Autonum
                      );

                      // If the item is found, update its ApprovalType
                      if (itemIndex !== -1) {
                        updatedData[itemIndex] = {
                          ...updatedData[itemIndex],
                          ApprovalType: newValue,
                        };

                        // Update the state with the new array
                        setGendralLedgerData(updatedData);
                      }
                    }}
                    style={{
                      borderRadius: 4,
                      borderColor: "#04447c",
                      backgroundColor: item?.ApprovalType
                        ? "#04447c"
                        : "transparent",
                    }}
                    color={"#04447c"}
                  />
                </View>

                <TouchableOpacity onPress={() => handleDetailPress(item)}>
                  <Icon
                    name="chevron-right"
                    size={24}
                    style={styles.navigateIcon}
                  />
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>
      
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: "rgba(0,0,0,0.3)",
          }}
        >
          <View
            style={{
              backgroundColor: "#fff",
              padding: 20,
              borderRadius: 10,
              width: "80%",
            }}
          >
            {selectedDetail && (
              <>
                <Text style={styles.headerText}>Detail</Text>
                <Text>Company: {selectedDetail.CompID}</Text>
                <Text>Document: {selectedDetail.DocType}</Text>
                <Text>Doc No: {selectedDetail.DocNo}</Text>
                <Text>Date: {selectedDetail.DocDt}</Text>
                <Text>Name: {selectedDetail.Name}</Text>
                <Text>Detail: {selectedDetail.Detail}</Text>
                <Text>Ref: {selectedDetail.Reference}</Text>
                <Text>Amount: {selectedDetail.Amount}</Text>
                <Text>Attach: {selectedDetail.AttachmentCount}</Text>
                <Text>Role: {selectedDetail.LevelDefinition}</Text>

                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <Text>Select :</Text>
                  <Checkbox
                    style={{ marginLeft: 5, marginTop: 2 }}
                    value={selectedDetail?.ApprovalType || false}
                    onValueChange={(newValue) => {
                      if (selectedDetail) {
                        // Update ApprovalType for selectedDetail
                        setSelectedDetail({ ...selectedDetail, ApprovalType: newValue });

                        // Update details array
                        if (newValue) {
                          if (!Array.isArray(details) || details.length === 0) {
                            setDetails([selectedDetail]);
                          } else {
                            setDetails((prev: any[]) => {
                              const exists = prev.some(
                                (d) => d.Autonum === selectedDetail?.Autonum
                              );
                              if (exists) {
                                return prev;
                              }
                              return [...prev, selectedDetail];
                            });
                          }
                        } else {
                          const filteredDetails = details?.filter(
                            (detail: any) => detail.Autonum !== selectedDetail?.Autonum
                          );
                          setDetails(filteredDetails);
                        }

                        // Update ApprovalType in receivablesData
                        const updatedData = GendralLedgerData.map((dataItem) =>
                          dataItem?.Autonum === selectedDetail?.Autonum
                            ? { ...dataItem, ApprovalType: newValue }
                            : dataItem
                        );
                        setGendralLedgerData(updatedData);
                      }
                    }}
                  />
                </View>
              </>
            )}
            <TouchableOpacity
              style={{ marginTop: 20, alignSelf: "flex-end" }}
              onPress={() => setModalVisible(false)}
            >
              <Text style={{ color: "#04447c", fontWeight: "bold" }}>
                Close
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      </>
      )}
    </View>
  );
}


function PayrollHR() {
  const detailNav = useNavigation();
  const useHttpService = useHttp();
  const [HrData, setHrData] = useState<ApprovalItem[]>(
    []
  );
  const [selectAll, setSelectAll] = useState(false);
  const [details, setDetails] = useState<UpdateDocDetails | any>();
  const [isLoading, setIsLoading] = useState(false);
  useEffect(() => {
    const updatedData = HrData.map((item) => ({
      ...item,
      ApprovalType: selectAll,
    }));
    setHrData(updatedData);
  }, [selectAll]);
  useEffect(() => {
    apiData();
  }, []);
  useEffect(() => {}, [details, selectAll]);
  const updateDocDetails = async () => {
       const compUrl =  await getCompUrl();
      const userId = await SecureStore.getItemAsync("userId");
    if (selectAll) {
      const dataAllValues = HrData.map((item: any) => ({
        AUTONUM: item.Autonum,
        USERID: userId,
        COMPID: item.CompID,
        LEVELSTATUS: item.ApprovalType ? "Approved" : "P",
        DOCTYPE: item.DocType,
        MODULE: aceConstants.MODULES.PAYROLL_AND_HR,
        FROMUSER: item.UserID,
        REMARKS: "",
        LINEWISE: "",
        LEVELS: item.Levels,
      }));
      const data = await useHttpService
        .sendRequest(
          `${compUrl}/api/${endpointConstants.UPDATEDOCAPPROVAL}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: dataAllValues,
          }
        )
        .then(async (response: any) => {
          if (response) {
             apiData();
          } else {
          }
        });
    } else {
      const dataValues = details.map((item: any) => ({
        AUTONUM: item.Autonum,
        USERID: userId,
        COMPID: item.CompID,
        LEVELSTATUS: item.ApprovalType ? "Approved" : "P",
        DOCTYPE: item.DocType,
        MODULE: aceConstants.MODULES.PAYROLL_AND_HR,
        FROMUSER: item.UserID,
        REMARKS: "",
        LINEWISE: "",
        LEVELS: item.Levels,
      }));
      const data = await useHttpService
        .sendRequest(
          `${compUrl}/api/${endpointConstants.UPDATEDOCAPPROVAL}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: dataValues,
          }
        )
        .then(async (response: any) => {
          if (response) {
                       console.log('request', dataValues);
          console.log('response', response);
             apiData();
          } else {
          }
        });
    }
  };
  const apiData = async () => {
    setIsLoading(true);
    try {
   const compUrl =  await getCompUrl();
      const compId = await SecureStore.getItemAsync("compId");
      const userId = await SecureStore.getItemAsync("userId");      
      const data = await useHttpService
        .sendRequest(
          `${compUrl}/api/${endpointConstants.GETAPPROVAL}/all/${userId}/${aceConstants.MODULES.PAYROLL_AND_HR}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
          }
        )
        .then(async (response: any) => {
          if (response) {
            if (response?.Data?.ApprovalDetails) {
              setHrData(response.Data.ApprovalDetails);
            }
          } else {
          }
        });
    } catch (err: any) {
      console.error("Error fetching data", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDetailPress = (item: any) => {
    // @ts-ignore
    detailNav.navigate("Detail", { item });
  };

  const [modalVisible, setModalVisible] = useState(false);
  const [selectedDetail, setSelectedDetail] = useState<ApprovalItem | null>(
    null
  );

  const [item, setSelectedItem] = useState<ApprovalItem | null>(null);
  return (
    <View style={styles.tabContent}>
      {isLoading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#04447c" />
        </View>
      ) : (
        <>
<View style={styles.tableHeaderTopRow}>
  {(selectAll===true || details?.length>0) && (
    <View style={styles.updateIconContainer}>
      <TouchableOpacity 
        style={styles.approveButton}
        onPress={() => updateDocDetails()}
      >
        <View style={styles.approveButtonContent}>
          <MaterialIcons name="approval" size={24} color="#04447c" />
          <Text style={styles.approveButtonText}>Approve</Text>
        </View>
      </TouchableOpacity>
    </View>
  )}
</View>

      <View style={styles.tableHeaderRow}>
        <Text style={[styles.tableHeaderText, { maxWidth: 35 }]}>CMP</Text>
        <Text style={styles.tableHeaderText}>DOC</Text>
        <Text style={[styles.tableHeaderText, { minWidth: 30 }]}>DNO</Text>
        <Text style={[styles.tableHeaderText, { minWidth: 30 }]}>DATE</Text>

        <Text style={styles.tableHeaderText}>REC</Text>
        <Text style={[styles.tableHeaderText, { minWidth: 35 }]}>AMT</Text>
        <View style={styles.checkboxcontainer}>
          <Checkbox
            value={selectAll}
            onValueChange={setSelectAll}
            style={{
              borderRadius: 4,
              borderColor: "#04447c",
              backgroundColor: selectAll ? "#04447c" : "transparent",
            }}
            color={"#04447c"}
          />
        </View>
        <Text style={styles.checkboxcontainer}></Text>
      </View>
      <ScrollView>
        {!HrData || HrData?.length === 0 ? (
          <View style={{ alignItems: "center", marginTop: 20 }}>
            <Text>No data yet</Text>
          </View>
        ) : (
          HrData.map((item) => (
            <View style={styles.rowborder} key={item.Autonum}>
              <View style={{ flexDirection: "row" }}>
                <Text
                  onPress={() => {
                    setSelectedDetail(item);
                    setModalVisible(true);
                  }}
                  style={[
                    styles.tableRowText,
                    { color: "#04447c", maxWidth: 35, fontWeight: "bold" },
                  ]}
                >
                  {item.CompID}
                </Text>
                <Text style={styles.tableRowText}>{item.DocType}</Text>
                <Text style={[styles.tableRowText, { minWidth: 30 }]}>
                  {item.DocNo}
                </Text>
                <Text style={[styles.tableRowText, { minWidth: 30 }]}>
                  {item.DocDt}
                </Text>
                <Text
                  style={styles.tableRowText}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {item.ReceivedFrom}
                </Text>
                <Text style={[styles.tableRowText, { minWidth: 35 }]}>
                  {item.Amount}
                </Text>

                <View style={styles.checkboxcontainer}>
                  <Checkbox
                    value={item?.ApprovalType || false}
                    onValueChange={(newValue) => {
                      if (newValue) {
                        if (!Array.isArray(details) || details?.length === 0) {
                          setDetails([item]); // initialize with the first item
                        } else {
                          setDetails((prev: any[]) => {
                            const exists = prev.some(
                              (d) => d.Autonum === item.Autonum
                            );
                            if (exists) {
                              return prev; // Skip if already exists
                            }
                            return [...prev, item]; // Add new item
                          });
                        }
                      } else {
                        const filteredDetails = details?.filter(
                          (detail: any) => detail.Autonum !== item.Autonum
                        );
                        setDetails(filteredDetails);
                      }
                      // Create a copy of the current data array
                      const updatedData = [...HrData];
                      // Find the index of the item being updated
                      const itemIndex = updatedData.findIndex(
                        (dataItem) => dataItem.Autonum === item.Autonum
                      );

                      // If the item is found, update its ApprovalType
                      if (itemIndex !== -1) {
                        updatedData[itemIndex] = {
                          ...updatedData[itemIndex],
                          ApprovalType: newValue,
                        };

                        // Update the state with the new array
                        setHrData(updatedData);
                      }
                    }}
                    style={{
                      borderRadius: 4,
                      borderColor: "#04447c",
                      backgroundColor: item?.ApprovalType
                        ? "#04447c"
                        : "transparent",
                    }}
                    color={"#04447c"}
                  />
                </View>

                <TouchableOpacity onPress={() => handleDetailPress(item)}>
                  <Icon
                    name="chevron-right"
                    size={24}
                    style={styles.navigateIcon}
                  />
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>
      
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: "rgba(0,0,0,0.3)",
          }}
        >
          <View
            style={{
              backgroundColor: "#fff",
              padding: 20,
              borderRadius: 10,
              width: "80%",
            }}
          >
            {selectedDetail && (
              <>
                <Text style={styles.headerText}>Detail</Text>
                <Text>Company: {selectedDetail.CompID}</Text>
                <Text>Document: {selectedDetail.DocType}</Text>
                <Text>Doc No: {selectedDetail.DocNo}</Text>
                <Text>Date: {selectedDetail.DocDt}</Text>
                <Text>Name: {selectedDetail.Name}</Text>
                <Text>Detail: {selectedDetail.Detail}</Text>
                <Text>Ref: {selectedDetail.Reference}</Text>
                <Text>Amount: {selectedDetail.Amount}</Text>
                <Text>Attach: {selectedDetail.AttachmentCount}</Text>
                <Text>Role: {selectedDetail.LevelDefinition}</Text>

                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <Text>Select :</Text>
                  <Checkbox
                    style={{ marginLeft: 5, marginTop: 2 }}
                    value={selectedDetail?.ApprovalType || false}
                    onValueChange={(newValue) => {
                      if (selectedDetail) {
                        // Update ApprovalType for selectedDetail
                        setSelectedDetail({ ...selectedDetail, ApprovalType: newValue });

                        // Update details array
                        if (newValue) {
                          if (!Array.isArray(details) || details?.length === 0) {
                            setDetails([selectedDetail]);
                          } else {
                            setDetails((prev: any[]) => {
                              const exists = prev.some(
                                (d) => d.Autonum === selectedDetail?.Autonum
                              );
                              if (exists) {
                                return prev;
                              }
                              return [...prev, selectedDetail];
                            });
                          }
                        } else {
                          const filteredDetails = details?.filter(
                            (detail: any) => detail.Autonum !== selectedDetail?.Autonum
                          );
                          setDetails(filteredDetails);
                        }

                        // Update ApprovalType in receivablesData
                        const updatedData = HrData.map((dataItem) =>
                          dataItem?.Autonum === selectedDetail?.Autonum
                            ? { ...dataItem, ApprovalType: newValue }
                            : dataItem
                        );
                        setHrData(updatedData);
                      }
                    }}
                  />
                </View>
              </>
            )}
            <TouchableOpacity
              style={{ marginTop: 20, alignSelf: "flex-end" }}
              onPress={() => setModalVisible(false)}
            >
              <Text style={{ color: "#04447c", fontWeight: "bold" }}>
                Close
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      </>
      )}
    </View>
  );
}

const Tab = createMaterialTopTabNavigator();
export default function ListScreen() {
  const navigation = useNavigation();

  function handleLogoutPress(): void {
    // Example: Clear user session and navigate to login screen
    // If using SecureStore or AsyncStorage, clear user data here
    navigation.reset({
      index: 0,
      routes: [{ name: "Login" as never }],
    });
  }

  return (
    <View style={styles.container}>
      <ImageBackground
        source={require("../../assets/images/headerbg.gif")} // Replace with your image path
        style={styles.header}
        resizeMode="cover"
      >
        <View>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Icon name="arrow-left" size={28} color="#fff" />
          </TouchableOpacity>
        </View>

        <View>
                  <TouchableOpacity style={styles.logout} onPress={() => handleLogoutPress()}>
                    <Icon name="logout" size={28} color="#fff" />
                  </TouchableOpacity>
                </View>
      </ImageBackground>

      <View style={{ flex: 1 }}>
        <Tab.Navigator
          screenOptions={{
            tabBarActiveTintColor: "#04447c", // active icon color
            tabBarInactiveTintColor: "#aaa", // inactive icon color
            tabBarShowIcon: true,
            lazy: true,
          }}
        >
          <Tab.Screen
            name="Receivables"
            component={Receivables}
            options={{
              title: "REC",
              tabBarIcon: ({ color }) => (
                <Icon name="call-received" color={color} size={24} />
              ),
            }}
          />
          <Tab.Screen
            name="Payables"
            component={Payables}
            options={{
              title: "PAY",
              tabBarIcon: ({ color }) => (
                <Icon name="contactless-payment" color={color} size={24} />
              ),
            }}
          />
          <Tab.Screen
            name="Materials"
            component={Materials}
            options={{
              title: "MAT",
              tabBarIcon: ({ color }) => (
                <Icon name="material-design" color={color} size={24} />
              ),
            }}
          />
          <Tab.Screen
            name="GL"
            component={GendralLedger}
            options={{
              title: "GL",
              tabBarIcon: ({ color }) => (
                <Icon name="home" color={color} size={24} />
              ),
            }}
          />
           <Tab.Screen
            name="HR"
            component={PayrollHR}
            options={{
              title: "HR",
              tabBarIcon: ({ color }) => (
                <Icon name="account-group" color={color} size={24} />
              ),
            }}
          />
        </Tab.Navigator>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  button: {
    padding: 10,
    borderRadius: 5,
    width: 70,
    height: 58,
    backgroundColor: "#04447C",
  },
  buttonPressed: {
    backgroundColor: "darkblue",
  },
  buttonText: {
    color: "white",
    textAlign: "center",
  },
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  selectAll: {
    marginLeft: 27,
    fontSize: 13,
    bottom: 17,
    fontWeight: 600,
  },
  header: {
    width: width, // Set width to screen width
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingLeft: 30,
    marginTop: 40,
  },
  headerText: {
    fontSize: 20,
    color: "#fff",
    fontWeight: "bold",
  },
  tabContent: {
    flex: 1,
    width: "100%",
    padding: 10,
    backgroundColor: "#f9f9f9",
  },

  logo: {
    width: 120,
    height: 60,
    alignSelf: "center",
  },

  rowContent: {
    flexDirection: "row",
    paddingVertical: 8,
    paddingHorizontal: 4,
    backgroundColor: "#fff",
    borderRadius: 8,
    marginBottom: 8,
    elevation: 1,
  },
  labelColumn: {
    flex: 5,
    paddingRight: 8,
  },
  valueColumn: {
    flex: 2,
    justifyContent: "space-between",
  },
  commonTextFont: {
    fontSize: 14,
    fontWeight: 600,
  },
  label: {
    fontWeight: "bold",
    color: "#04447c",
    marginBottom: 2,
  },
  iconRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 8,
    flex: 1,
    marginTop: 10,
  },
  iconButton: {
    flexDirection: "column",
    alignItems: "center",
    flex: 2, // centers icon and text vertically
    borderColor: "rgba(192, 202, 192, 1)",
    borderWidth: 1,
    padding: 2,
    margin: 2,
    borderRadius: 5,
    backgroundColor: "#f0f0f0",
  },
  iconText: {
    color: "#04447c",
    fontWeight: "bold",
    fontSize: 12, // adjust font size as needed
  },
  linkText: {
    color: "blue",
    textDecorationLine: "underline",
  },
  tableHeaderRow: {
    flexDirection: "row",
    borderRadius: 4,
    backgroundColor: "#e0e7ef",
    marginBottom: 4,
    paddingVertical: 6,
    paddingHorizontal: 4,
    justifyContent: "space-between", // Add this line
    alignItems: "center",
  },

  tableHeaderTopRow: {
    flexDirection: "row",
    borderRadius: 4,
    marginBottom: 4,
    paddingVertical: 6,
    paddingHorizontal: 4,
    justifyContent: "space-between", // Add this line
    alignItems: "center",
  },
 updateIconContainer: {
    marginLeft: 'auto',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 2,
    marginRight: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  approveButton: {
    padding: 6,
    borderRadius: 4,
    backgroundColor: '#fff',
  },
  approveButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  approveButtonText: {
    marginLeft: 8,
    color: '#04447c',
    fontWeight: 'bold',
    fontSize: 14,
  },
  tableHeaderText: {
    flex: 1,
    fontWeight: "bold",
    color: "#04447c",
    fontSize: 12,
    marginBottom: 2,
    marginLeft: 5,
  },

  tableRowText: {
    flex: 1,
    fontSize: 10,
    marginBottom: 2,
    marginLeft: 5,
  },

  rowborder: {
    borderBottomWidth: 1,
    borderBottomColor: "#adab9cff",
    paddingVertical: 10,
  },
  rowApproval:{
   backgroundColor: "#bf8b97ff",
  },
  checkboxcontainer: {
    marginRight: 5,
    marginTop: 2,
    flex: 1,
    alignItems: "flex-end",
    maxWidth: 15,
  },
  navigateIcon: {
    fontSize: 24,
    color: "#04447c",
    fontWeight: "bold",
    maxWidth: 24,
    marginTop: -2,
  },

  updateIcon: {
    fontSize: 28,
    color: "#04447c",
  },

  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  logout: {
    marginRight: 5, // Add some spacing between the icon and text
  },
});
