// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract EvidenceStorage {
    
    struct Evidence {
        string fileHash;
        string metadata;
        address uploadedBy;
        uint256 timestamp;
        bool isSealed;
    }
    
    mapping(uint256 => Evidence) public evidences;
    mapping(string => uint256) public hashToEvidenceId;
    mapping(address => bool) public authorizedUsers;
    mapping(address => string) public userRoles;
    
    uint256 public evidenceCounter;
    
    event EvidenceStored(uint256 indexed evidenceId, string fileHash, address indexed uploadedBy);
    event EvidenceSealed(uint256 indexed evidenceId, address indexed sealedBy);
    event UserAuthorized(address indexed user, address indexed authorizedBy);
    event UserDeauthorized(address indexed user, address indexed deauthorizedBy);
    
    modifier onlyAuthorized() {
        require(authorizedUsers[msg.sender], "Not authorized");
        _;
    }
    
    constructor() {
        authorizedUsers[msg.sender] = true;
        userRoles[msg.sender] = "admin";
    }
    
    function storeEvidence(string memory _fileHash, string memory _metadata) 
        public onlyAuthorized returns (uint256) {
        require(hashToEvidenceId[_fileHash] == 0, "Hash already exists");
        
        evidenceCounter++;
        evidences[evidenceCounter] = Evidence({
            fileHash: _fileHash,
            metadata: _metadata,
            uploadedBy: msg.sender,
            timestamp: block.timestamp,
            isSealed: false
        });
        
        hashToEvidenceId[_fileHash] = evidenceCounter;
        emit EvidenceStored(evidenceCounter, _fileHash, msg.sender);
        return evidenceCounter;
    }
    
    function getEvidence(uint256 _evidenceId) public view returns (
        string memory fileHash,
        string memory metadata,
        address uploadedBy,
        uint256 timestamp,
        bool isSealed
    ) {
        Evidence memory evidence = evidences[_evidenceId];
        return (evidence.fileHash, evidence.metadata, evidence.uploadedBy, evidence.timestamp, evidence.isSealed);
    }
    
    function verifyHash(string memory _fileHash) public view returns (bool exists, uint256 evidenceId) {
        evidenceId = hashToEvidenceId[_fileHash];
        exists = evidenceId > 0;
    }
    
    function authorizeUser(address _user, string memory _role) public {
        require(authorizedUsers[msg.sender], "Not authorized");
        require(keccak256(abi.encodePacked(userRoles[msg.sender])) == keccak256(abi.encodePacked("admin")), "Only admin can authorize");
        authorizedUsers[_user] = true;
        userRoles[_user] = _role;
        emit UserAuthorized(_user, msg.sender);
    }
    
    function deauthorizeUser(address _user) public {
        require(authorizedUsers[msg.sender], "Not authorized");
        require(keccak256(abi.encodePacked(userRoles[msg.sender])) == keccak256(abi.encodePacked("admin")), "Only admin can deauthorize");
        require(authorizedUsers[_user], "User not authorized");
        require(_user != msg.sender, "Cannot deauthorize yourself");
        authorizedUsers[_user] = false;
        delete userRoles[_user];
        emit UserDeauthorized(_user, msg.sender);
    }
    
    function sealEvidence(uint256 _evidenceId) public onlyAuthorized {
        require(_evidenceId > 0 && _evidenceId <= evidenceCounter, "Evidence does not exist");
        require(!evidences[_evidenceId].isSealed, "Evidence already sealed");
        evidences[_evidenceId].isSealed = true;
        emit EvidenceSealed(_evidenceId, msg.sender);
    }
}
